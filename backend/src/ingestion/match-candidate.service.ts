import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import Fuse from 'fuse.js';

export interface ReferencePlayer {
  playerId: string;
  playerName: string;
  year: number;
  setName: string;
}

export interface MatchCandidate extends ReferencePlayer {
  confidence: number;
}

@Injectable()
export class MatchCandidateService implements OnModuleInit {
  private referenceData: ReferencePlayer[] = [];
  private fuse: Fuse<ReferencePlayer>;
  private readonly logger = new Logger(MatchCandidateService.name);

  async onModuleInit() {
    this.loadReferenceData();
  }

  private loadReferenceData() {
    try {
      const filePath = path.join(process.cwd(), 'data', 'refPlayers.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.referenceData = JSON.parse(fileContent);

      this.fuse = new Fuse(this.referenceData, {
        keys: ['playerName', 'setName'],
        includeScore: true,
        threshold: 0.6,
        ignoreLocation: true,
      });

      this.logger.log(
        `Loaded ${this.referenceData.length} reference players for matching.`,
      );
    } catch (error) {
      this.logger.error('Failed to load reference player data', error.stack);
      // Initialize with empty array if file fails to load
      this.referenceData = [];
      this.fuse = new Fuse([], {});
    }
  }

  async findCandidates(ocrText: string): Promise<MatchCandidate[]> {
    if (!ocrText || this.referenceData.length === 0) {
      return [];
    }

    // Extract potential years from text (4-digit numbers)
    const yearMatches = ocrText.match(/\b(19|20)\d{2}\b/g);
    const yearsInText = yearMatches ? yearMatches.map(Number) : [];

    const results = this.fuse.search(ocrText);
    const candidateMap = new Map<string, MatchCandidate>();

    for (const result of results) {
      const item = result.item;
      let confidence = 1 - (result.score || 0);

      // Manual weighting: check if playerName is specifically found in text
      const lowerText = ocrText.toLowerCase();
      const lowerName = item.playerName.toLowerCase();
      if (lowerText.includes(lowerName)) {
        confidence = Math.min(0.99, confidence + 0.4);
      }

      // Boost confidence if year matches exactly
      if (yearsInText.includes(item.year)) {
        confidence = Math.min(0.99, confidence + 0.3);
      } else if (yearsInText.length > 0) {
        // Penalize if there are years in text but none match this item
        confidence = Math.max(0.1, confidence - 0.4);
      }

      const existing = candidateMap.get(item.playerId);
      if (!existing || existing.confidence < confidence) {
        candidateMap.set(item.playerId, {
          ...item,
          confidence: parseFloat(confidence.toFixed(2)),
        });
      }
    }

    return Array.from(candidateMap.values())
      .filter((c) => c.confidence > 0.4)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5
  }
}
