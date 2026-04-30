import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingConfig } from '@prisma/client';
import { Rarity } from '@prisma/client';
import { CalcRatingDto, CardInput } from './dto/calc-rating.dto';
import {
  CalcRatingResponseDto,
  RatingBreakdownItem,
} from './dto/calc-rating-response.dto';

interface RatingWeights {
  playerStats: number;
  marketValueCents: number;
  conditionEstimatedScore: number;
  rarity: number;
  momentum: number;
}

interface FactorBounds {
  min: number;
  max: number;
}

interface NormalizationBounds {
  playerStats: FactorBounds;
  marketValueCents: FactorBounds;
  conditionEstimatedScore: FactorBounds;
  rarity: FactorBounds;
  momentum: FactorBounds;
}

const RARITY_NUMERIC: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra_rare: 4,
  secret_rare: 5,
};

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scheduleRating(cardId: string) {
    const job = await this.prisma.ratingJob.create({
      data: {
        cardId,
        status: 'pending',
      },
    });
    this.logger.log(`Scheduled rating job ${job.id} for card ${cardId}`);
    return job;
  }

  async getConfig(version?: string): Promise<RatingConfig> {
    if (version) {
      const config = await this.prisma.ratingConfig.findUnique({
        where: { version },
      });
      if (!config)
        throw new NotFoundException(`RatingConfig ${version} not found`);
      return config;
    }
    const activeConfig = await this.prisma.ratingConfig.findFirst({
      where: { isActive: true },
    });
    if (!activeConfig)
      throw new NotFoundException('No active RatingConfig found');
    return activeConfig;
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0;
    const normalized = (value - min) / (max - min);
    return Math.max(0, Math.min(1, normalized));
  }

  async calculate(dto: CalcRatingDto): Promise<CalcRatingResponseDto> {
    const config = await this.getConfig(dto.ratingConfigVersion);
    const weights = config.weights as unknown as RatingWeights;
    const normalizationBounds =
      config.normalizationBounds as unknown as NormalizationBounds;
    const card = dto.card;

    // Normalize weights to sum to 1
    const totalWeight =
      weights.playerStats +
      weights.marketValueCents +
      weights.rarity +
      weights.conditionEstimatedScore +
      weights.momentum;

    const normalizedWeights: RatingWeights =
      totalWeight > 0
        ? {
            playerStats: weights.playerStats / totalWeight,
            marketValueCents: weights.marketValueCents / totalWeight,
            rarity: weights.rarity / totalWeight,
            conditionEstimatedScore:
              weights.conditionEstimatedScore / totalWeight,
            momentum: weights.momentum / totalWeight,
          }
        : {
            playerStats: 0.2,
            marketValueCents: 0.2,
            rarity: 0.2,
            conditionEstimatedScore: 0.2,
            momentum: 0.2,
          };

    const breakdown: RatingBreakdownItem[] = [];
    let rawScore = 0;

    const processFactor = (
      factor: string,
      inputValue: number,
      weight: number,
      bounds: { min: number; max: number },
    ) => {
      const normalized = this.normalize(inputValue, bounds.min, bounds.max);
      const contribution = normalized * weight;
      rawScore += contribution;
      breakdown.push({
        factor,
        inputValue,
        normalizedValue: normalized,
        weight,
        contribution,
        normalizationBounds: bounds,
      });
    };

    // Player Stats
    processFactor(
      'playerStats',
      card.playerStats,
      normalizedWeights.playerStats,
      normalizationBounds.playerStats,
    );

    // Market Value (fallback to midpoint if missing)
    let marketValue = card.marketValueCents;
    if (marketValue === undefined) {
      const { min, max } = normalizationBounds.marketValueCents;
      marketValue = (min + max) / 2;
    }
    processFactor(
      'marketValueCents',
      marketValue,
      normalizedWeights.marketValueCents,
      normalizationBounds.marketValueCents,
    );

    // Rarity (map enum to numeric)
    const rarityNumeric = RARITY_NUMERIC[card.rarity];
    processFactor(
      'rarity',
      rarityNumeric,
      normalizedWeights.rarity,
      normalizationBounds.rarity,
    );

    // Condition Estimated Score
    let condition = card.conditionEstimatedScore;
    if (condition === undefined) {
      const { min, max } = normalizationBounds.conditionEstimatedScore;
      condition = (min + max) / 2;
    }
    processFactor(
      'conditionEstimatedScore',
      condition,
      normalizedWeights.conditionEstimatedScore,
      normalizationBounds.conditionEstimatedScore,
    );

    // Momentum (default to 0 if missing)
    const momentum = card.momentum ?? 0;
    processFactor(
      'momentum',
      momentum,
      normalizedWeights.momentum,
      normalizationBounds.momentum,
    );

    const powerScore = Math.max(0, Math.min(1000, Math.round(rawScore * 1000)));

    return {
      powerScore,
      ratingConfigVersion: config.version,
      breakdown,
    };
  }
}
