import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from './card.service';
import { PrismaService } from '../prisma/prisma.service';
import { RatingService } from '../rating/rating.service';
import { S3Service } from '../storage/s3.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConditionReported, Rarity } from '@prisma/client';

describe('CardService', () => {
  let service: CardService;

  const mockPrisma = {
    card: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ratingJob: {
      create: jest.fn(),
    },
  };

  const mockRatingService = {
    calculate: jest.fn(),
    scheduleRating: jest.fn(),
  };

  const mockS3Service = {
    getPresignedDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RatingService, useValue: mockRatingService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
  });

  describe('listCards', () => {
    it('should list cards for the owner', async () => {
      const userId = 'user-1';
      const mockCards = [{ id: 'card-1', userId }];
      mockPrisma.card.findMany.mockResolvedValue(mockCards);
      mockPrisma.card.count.mockResolvedValue(1);

      const result = await service.listCards(userId, userId);

      expect(result.data).toEqual(mockCards);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
    });

    it('should throw ForbiddenException if requesting cards for another user', async () => {
      await expect(service.listCards('user-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should apply filters correctly', async () => {
      const userId = 'user-1';
      const filters = { rarity: Rarity.rare, year: 2023 };
      mockPrisma.card.findMany.mockResolvedValue([]);
      mockPrisma.card.count.mockResolvedValue(0);

      await service.listCards(userId, userId, filters);

      expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            rarity: Rarity.rare,
            year: 2023,
          }),
        }),
      );
    });
  });

  describe('getCard', () => {
    it('should return card if owner', async () => {
      const userId = 'user-1';
      const cardId = 'card-1';
      const mockCard = { id: cardId, userId };
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.getCard(userId, cardId);
      expect(result).toEqual(mockCard);
    });

    it('should throw NotFoundException if card does not exist', async () => {
      mockPrisma.card.findUnique.mockResolvedValue(null);
      await expect(service.getCard('user-1', 'card-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      const mockCard = { id: 'card-1', userId: 'user-2' };
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      await expect(service.getCard('user-1', 'card-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateCardMetadata', () => {
    it('should update metadata and schedule rating if condition changes', async () => {
      const userId = 'user-1';
      const cardId = 'card-1';
      const mockCard = { id: cardId, userId };
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      const updatedCard = {
        ...mockCard,
        conditionReported: ConditionReported.mint,
      };
      mockPrisma.card.update.mockResolvedValue(updatedCard);

      await service.updateCardMetadata(userId, cardId, {
        conditionReported: ConditionReported.mint,
      });

      expect(mockPrisma.card.update).toHaveBeenCalled();
      expect(mockRatingService.scheduleRating).toHaveBeenCalledWith(cardId);
    });
  });
});
