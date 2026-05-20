import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { PrismaService } from '../prisma/prisma.service';
import { Rarity } from '@prisma/client';
import { CalcRatingDto } from './dto/calc-rating.dto';

describe('RatingService', () => {
  let service: RatingService;

  const mockConfig = {
    id: 'config-1',
    version: '1.0.0',
    isActive: true,
    weights: {
      playerStats: 0.4,
      marketValueCents: 0.2,
      conditionEstimatedScore: 0.2,
      rarity: 0.1,
      momentum: 0.1,
    },
    normalizationBounds: {
      playerStats: { min: 0, max: 100 },
      marketValueCents: { min: 0, max: 1000000 },
      conditionEstimatedScore: { min: 0, max: 100 },
      rarity: { min: 1, max: 5 },
      momentum: { min: -10, max: 10 },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    ratingConfig: {
      findUnique: jest.fn().mockResolvedValue(mockConfig),
      findFirst: jest.fn().mockResolvedValue(mockConfig),
      updateMany: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(mockConfig),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
  });

  describe('calculate', () => {
    it('should return deterministic results for same inputs', async () => {
      const dto: CalcRatingDto = {
        card: {
          id: 'card-1',
          playerStats: 80,
          marketValueCents: 500000,
          rarity: Rarity.rare,
          conditionEstimatedScore: 85,
          momentum: 5,
        },
      };

      const result1 = await service.calculate(dto);
      const result2 = await service.calculate(dto);

      expect(result1.powerScore).toEqual(result2.powerScore);
      expect(result1.ratingConfigVersion).toEqual(result2.ratingConfigVersion);
    });

    it('should fallback to median for missing marketValueCents', async () => {
      const dto: CalcRatingDto = {
        card: {
          id: 'card-1',
          playerStats: 80,
          rarity: Rarity.rare,
          conditionEstimatedScore: 85,
          momentum: 5,
        },
      };

      const result = await service.calculate(dto);
      const marketItem = result.breakdown.find(
        (f) => f.factor === 'marketValueCents',
      );
      expect(marketItem?.inputValue).toBe(500000);
    });

    it('should handle zero momentum', async () => {
      const dto: CalcRatingDto = {
        card: {
          id: 'card-1',
          playerStats: 80,
          marketValueCents: 500000,
          rarity: Rarity.rare,
          conditionEstimatedScore: 85,
          momentum: 0,
        },
      };

      const result = await service.calculate(dto);
      const momentumItem = result.breakdown.find(
        (f) => f.factor === 'momentum',
      );
      expect(momentumItem?.inputValue).toBe(0);
      expect(momentumItem?.normalizedValue).toBe(0.5);
    });
  });
});
