import { Test, TestingModule } from '@nestjs/testing';
import { AdminIngestionController } from './admin-ingestion.controller';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('AdminIngestionController', () => {
  let controller: AdminIngestionController;
  let prisma: PrismaService;

  const mockPrismaService = {
    cardIngestionJob: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminIngestionController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<AdminIngestionController>(AdminIngestionController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getQueue', () => {
    it('should return paginated queue', async () => {
      const mockItems = [{ id: '1', status: 'uploaded' }];
      mockPrismaService.cardIngestionJob.findMany.mockResolvedValue(mockItems);
      mockPrismaService.cardIngestionJob.count.mockResolvedValue(1);

      const result = await controller.getQueue({ page: 1, limit: 10 });

      expect(result.items).toEqual(mockItems);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.cardIngestionJob.findMany).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should update job status to verified', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({ id: 'job-1' });
      mockPrismaService.cardIngestionJob.update.mockResolvedValue({ id: 'job-1', status: IngestionStatus.verified });

      const result = await controller.approve('job-1');

      expect(result.status).toBe(IngestionStatus.verified);
      expect(mockPrismaService.cardIngestionJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: IngestionStatus.verified },
      });
    });

    it('should throw BadRequestException if job not found', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue(null);

      await expect(controller.approve('invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should update job status to flagged', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({ id: 'job-1' });
      mockPrismaService.cardIngestionJob.update.mockResolvedValue({ id: 'job-1', status: IngestionStatus.flagged });

      const result = await controller.reject('job-1', 'Low quality image');

      expect(result.status).toBe(IngestionStatus.flagged);
      expect(mockPrismaService.cardIngestionJob.update).toHaveBeenCalled();
    });
  });
});
