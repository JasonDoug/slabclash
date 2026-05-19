import { Test, TestingModule } from '@nestjs/testing';
import { AntiFraudService } from './anti-fraud.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AntiFraudService', () => {
  let service: AntiFraudService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      card: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntiFraudService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AntiFraudService>(AntiFraudService);
  });

  describe('checkDuplicate', () => {
    it('should return isDuplicate: false if phash is missing', async () => {
      const result = await service.checkDuplicate('', 'user-1');
      expect(result.isDuplicate).toBe(false);
    });

    it('should detect duplicate when distance is within threshold', async () => {
      // Threshold is 10 by default
      const currentPhash = 'ffffffffffffffff';
      const existingCard = { id: 'card-old', phash: 'fffffffffffffffe' }; // distance 1

      mockPrismaService.card.findMany.mockResolvedValue([existingCard]);

      const result = await service.checkDuplicate(currentPhash, 'user-1');

      expect(result.isDuplicate).toBe(true);
      expect(result.similarCardId).toBe('card-old');
    });

    it('should not detect duplicate when distance is above threshold', async () => {
      const currentPhash = 'ffffffffffffffff';
      const existingCard = { id: 'card-old', phash: '0000000000000000' }; // distance 64

      mockPrismaService.card.findMany.mockResolvedValue([existingCard]);

      const result = await service.checkDuplicate(currentPhash, 'user-1');

      expect(result.isDuplicate).toBe(false);
    });

    it('should exclude the current card if cardId is provided', async () => {
      const phash = 'ffffffffffffffff';
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await service.checkDuplicate(phash, 'user-1', 'card-1');

      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'card-1' },
          }),
        }),
      );
    });
  });
});
