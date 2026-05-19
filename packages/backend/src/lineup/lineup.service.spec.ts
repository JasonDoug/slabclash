import { Test, TestingModule } from '@nestjs/testing';
import { LineupService } from './lineup.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LineupService', () => {
  let service: LineupService;
  let prisma: PrismaService;

  const mockPrismaService = {
    card: {
      findMany: jest.fn(),
    },
    lineup: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LineupService>(LineupService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create lineup with valid cards', async () => {
    const userId = 'user-1';
    const slots = { P1: 'card-1', P2: 'card-2' };
    const cards = [
      { id: 'card-1', userId, powerScore: 100, rarity: 'common' },
      { id: 'card-2', userId, powerScore: 200, rarity: 'rare' },
    ];

    mockPrismaService.card.findMany.mockResolvedValue(cards);
    mockPrismaService.lineup.create.mockResolvedValue({
      id: 'lineup-1',
      userId,
      name: 'Test Lineup',
      slots,
      aggregatePowerScore: 300,
      rarityCounts: { common: 1, rare: 1 },
    });

    const result = await service.createLineup(userId, 'Test Lineup', slots);

    expect(result.aggregatePowerScore).toBe(300);
    expect(result.rarityCounts).toEqual({ common: 1, rare: 1 });
  });

  it('should reject lineup with cards not owned by user', async () => {
    const userId = 'user-1';
    const slots = { P1: 'card-1' };

    mockPrismaService.card.findMany.mockResolvedValue([]);

    await expect(service.createLineup(userId, 'Test', slots)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should get lineup by id', async () => {
    const lineup = { id: 'lineup-1', userId: 'user-1', name: 'Test' };
    mockPrismaService.lineup.findFirst.mockResolvedValue(lineup);

    const result = await service.getLineup('lineup-1', 'user-1');
    expect(result.id).toBe('lineup-1');
  });

  it('should throw NotFoundException for non-existent lineup', async () => {
    mockPrismaService.lineup.findFirst.mockResolvedValue(null);

    await expect(service.getLineup('invalid', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
