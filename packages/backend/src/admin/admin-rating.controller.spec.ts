import { Test, TestingModule } from '@nestjs/testing';
import { AdminRatingController } from './admin-rating.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('AdminRatingController', () => {
  let controller: AdminRatingController;
  let prisma: PrismaService;

  const mockPrismaService = {
    ratingConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
    },
    ratingJob: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      if (typeof cb === 'function') return cb(mockPrismaService);
      return cb;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRatingController],
      providers: [{ provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    controller = module.get<AdminRatingController>(AdminRatingController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('activateConfig', () => {
    it('should activate config and enqueue recalculation jobs', async () => {
      const configId = 'config-1';
      const mockConfig = { id: configId, version: 'v2' };
      const mockCards = [{ id: 'card-1' }, { id: 'card-2' }];

      mockPrismaService.ratingConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);
      mockPrismaService.ratingJob.createMany.mockResolvedValue({ count: 2 });

      const result = await controller.activateConfig(configId);

      expect(result.activated).toBe('v2');
      expect(result.enqueuedJobs).toBe(2);
      expect(mockPrismaService.ratingConfig.update).toHaveBeenCalled();
      expect(mockPrismaService.ratingJob.createMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if config not found', async () => {
      mockPrismaService.ratingConfig.findUnique.mockResolvedValue(null);

      await expect(controller.activateConfig('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
