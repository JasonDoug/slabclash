import { Test, TestingModule } from '@nestjs/testing';
import { AdminDisputeController } from './admin-dispute.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('AdminDisputeController', () => {
  let controller: AdminDisputeController;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      dispute: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      card: {
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        if (typeof cb === 'function') return cb(mockPrismaService);
        return cb;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDisputeController],
      providers: [{ provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    controller = module.get<AdminDisputeController>(AdminDisputeController);
  });

  describe('getDisputes', () => {
    it('should return paginated disputes', async () => {
      mockPrismaService.dispute.findMany.mockResolvedValue([]);
      mockPrismaService.dispute.count.mockResolvedValue(0);

      const result = await controller.getDisputes();
      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute and verify card if resolution is resolved', async () => {
      mockPrismaService.dispute.findUnique.mockResolvedValue({
        id: 'd-1',
        cardId: 'card-1',
      });
      mockPrismaService.dispute.update.mockResolvedValue({
        id: 'd-1',
        status: 'resolved',
      });

      await controller.resolveDispute('d-1', 'resolved');

      expect(mockPrismaService.dispute.update).toHaveBeenCalledWith({
        where: { id: 'd-1' },
        data: { status: 'resolved' },
      });
      expect(mockPrismaService.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: { ingestionStatus: 'verified' },
      });
    });

    it('should reject resolution if status is invalid', async () => {
      await expect(
        controller.resolveDispute('d-1', 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
