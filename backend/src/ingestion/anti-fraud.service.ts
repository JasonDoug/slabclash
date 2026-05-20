import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeHammingDistance } from './utils/phash.utils';

@Injectable()
export class AntiFraudService {
  private readonly logger = new Logger(AntiFraudService.name);
  private readonly THRESHOLD = parseInt(
    process.env.PHASH_THRESHOLD || '10',
    10,
  );

  constructor(private prisma: PrismaService) {}

  /**
   * Checks if a card with a similar pHash already exists.
   * Returns information about the duplicate if found.
   */
  async checkDuplicate(
    phash: string,
    currentUserId: string,
    excludeCardId?: string,
  ): Promise<{ isDuplicate: boolean; similarCardId?: string }> {
    if (!phash) return { isDuplicate: false };

    // Fetch recent cards to check for similarity
    // In a large-scale system, this would use a specialized vector or metric index.
    // For MVP, we scan recent cards or cards of the same player.
    const recentCards = await this.prisma.card.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
      where: {
        id: { not: excludeCardId },
        phash: { not: null },
        // We could narrow this down to same player/year for performance
      },
      select: { id: true, phash: true },
    });

    for (const card of recentCards) {
      if (card.phash) {
        const distance = computeHammingDistance(phash, card.phash);
        if (distance <= this.THRESHOLD) {
          this.logger.warn(
            `Duplicate detected for user ${currentUserId}: new phash ${phash} is similar to existing card ${card.id} (phash: ${card.phash}, distance: ${distance})`,
          );
          return { isDuplicate: true, similarCardId: card.id };
        }
      }
    }

    return { isDuplicate: false };
  }
}
