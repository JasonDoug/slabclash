import { Test, TestingModule } from '@nestjs/testing';
import { RatingRecalculationWorker } from './rating-recalculation.worker';
import { PrismaService } from '../prisma/prisma.service';
import { RatingService } from './rating.service';

describe('RatingRecalculationWorker', () => {
  let worker: RatingRecalculationWorker;
  let mockPrismaService: any;
  let mockRatingService: any;

  beforeEach(async () => {
    mockPrismaService = {
      ratingJob: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      card: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') return cb(mockPrismaService);
        return cb;
      }),
    };

    mockRatingService = {
      calculate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingRecalculationWorker,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RatingService, useValue: mockRatingService },
      ],
    }).compile();

    worker = module.get<RatingRecalculationWorker>(RatingRecalculationWorker);
  });

  describe('processJobs', () => {
    it('should process pending jobs and update status', async () => {
      const mockJobs = [{ id: 'job-1', cardId: 'card-1' }];
      const mockCard = {
        id: 'card-1',
        powerScore: 500,
        ratingConfigVersion: 'v1',
        rarity: 'common',
      };
      const mockRatingResult = { powerScore: 600, ratingConfigVersion: 'v2' };

      mockPrismaService.ratingJob.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockRatingService.calculate.mockResolvedValue(mockRatingResult);

      await worker.processJobs();

      expect(mockPrismaService.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: { powerScore: 600, ratingConfigVersion: 'v2' },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(mockPrismaService.ratingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'completed' },
      });
    });

    it('should not write audit log if score and version are unchanged', async () => {
      const mockJobs = [{ id: 'job-1', cardId: 'card-1' }];
      const mockCard = {
        id: 'card-1',
        powerScore: 500,
        ratingConfigVersion: 'v1',
        rarity: 'common',
      };
      const mockRatingResult = { powerScore: 500, ratingConfigVersion: 'v1' };

      mockPrismaService.ratingJob.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockRatingService.calculate.mockResolvedValue(mockRatingResult);

      await worker.processJobs();

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
      expect(mockPrismaService.ratingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'completed' },
      });
    });

    it('should mark job as failed if processing throws', async () => {
      const mockJobs = [{ id: 'job-1', cardId: 'card-1' }];
      mockPrismaService.ratingJob.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.card.findUnique.mockRejectedValue(
        new Error('DB Error'),
      );

      await worker.processJobs();

      expect(mockPrismaService.ratingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'failed' },
      });
    });
  });
});
