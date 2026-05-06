import { Test, TestingModule } from '@nestjs/testing';
import { MatchEngineService } from './match-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import seedrandom from 'seedrandom';

describe('MatchEngineService', () => {
  let service: MatchEngineService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      match: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      card: {
        findMany: jest.fn(),
      },
    };

    const mockRealtimeService = {
      publishToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchEngineService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'RealtimeService', useValue: mockRealtimeService },
      ],
    }).compile();

    service = module.get<MatchEngineService>(MatchEngineService);
  });

  describe('resolveMatch - deterministic resolution', () => {
    it('should return same winner with same seed across multiple calls', async () => {
      const lineupSlotsA = { PG: 'card-1', SG: 'card-2' };
      const lineupSlotsB = { PG: 'card-3', SG: 'card-4' };
      const seed = 'test-seed-123';

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 85, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 90, marketValueCents: 1200 },
        { id: 'card-3', playerStats: 80, marketValueCents: 900 },
        { id: 'card-4', playerStats: 88, marketValueCents: 1100 },
      ]);

      const dto1: any = { lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: seed };
      const dto2: any = { lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: seed };

      const result1 = await service.resolveMatch(dto1);
      const result2 = await service.resolveMatch(dto2);

      expect(result1.winner).toBe(result2.winner);
      expect(result1.scoreA).toBe(result2.scoreA);
      expect(result1.scoreB).toBe(result2.scoreB);
    });

    it('should produce valid results with different seeds when scores are tied', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 80, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 80, marketValueCents: 1000 },
      ]);

      const result1 = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed-A' } as any);
      const result2 = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed-B' } as any);

      expect(['A', 'B', 'draw']).toContain(result1.winner);
      expect(['A', 'B', 'draw']).toContain(result2.winner);
    });
  });

  describe('position comparison', () => {
    it('should award 1 point to A when statA > statB', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 90, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 70, marketValueCents: 1000 },
      ]);

      const result = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed' } as any);

      expect(result.scoreA).toBe(1);
      expect(result.scoreB).toBe(0);
      expect(result.perPositionResults[0].winner).toBe('A');
      expect(result.perPositionResults[0].pointsA).toBe(1);
      expect(result.perPositionResults[0].pointsB).toBe(0);
    });

    it('should award 1 point to B when statB > statA', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 60, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 85, marketValueCents: 1000 },
      ]);

      const result = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed' } as any);

      expect(result.scoreA).toBe(0);
      expect(result.scoreB).toBe(1);
      expect(result.perPositionResults[0].winner).toBe('B');
    });

    it('should award 0.5 points each on a tie', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 80, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 80, marketValueCents: 1000 },
      ]);

      const result = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed' } as any);

      expect(result.scoreA).toBe(0.5);
      expect(result.scoreB).toBe(0.5);
      expect(result.perPositionResults[0].winner).toBe('draw');
    });
  });

  describe('tiebreakers', () => {
    it('should use market value tiebreaker when scores are tied', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 80, marketValueCents: 1500 },
        { id: 'card-2', playerStats: 80, marketValueCents: 900 },
      ]);

      const result = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed' } as any);

      expect(result.winner).toBe('A');
      expect(result.events.some((e: any) => e.type === 'tiebreaker_market_value')).toBe(true);
    });

    it('should use momentum tiebreaker when scores and market value are tied', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 80, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 80, marketValueCents: 1000 },
      ]);

      const result = await service.resolveMatch({
        lineupA: { slots: lineupSlotsA, aggregateMomentum: 5 },
        lineupB: { slots: lineupSlotsB, aggregateMomentum: 3 },
        matchSeed: 'seed',
      } as any);

      expect(result.winner).toBe('A');
      expect(result.events.some((e: any) => e.type === 'tiebreaker_momentum')).toBe(true);
    });

    it('should use sudden death when all tiebreakers are tied', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 80, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 80, marketValueCents: 1000 },
      ]);

      const result = await service.resolveMatch({
        lineupA: { slots: lineupSlotsA, aggregateMomentum: 0 },
        lineupB: { slots: lineupSlotsB, aggregateMomentum: 0 },
        matchSeed: 'seed-123',
      } as any);

      expect(result.events.some((e: any) => e.type === 'tiebreaker_sudden_death')).toBe(true);
      expect(['A', 'B']).toContain(result.winner);
    });
  });

  describe('ResolutionResult structure', () => {
    it('should return all required fields', async () => {
      const lineupSlotsA = { PG: 'card-1' };
      const lineupSlotsB = { PG: 'card-2' };

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 85, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 75, marketValueCents: 1000 },
      ]);

      const result = await service.resolveMatch({ lineupA: { slots: lineupSlotsA }, lineupB: { slots: lineupSlotsB }, matchSeed: 'seed' } as any);

      expect(result).toHaveProperty('winner');
      expect(result).toHaveProperty('scoreA');
      expect(result).toHaveProperty('scoreB');
      expect(result).toHaveProperty('perPositionResults');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('matchSeed');
      expect(result).toHaveProperty('resolvedAt');
      expect(result.perPositionResults.length).toBe(1);
      expect(result.perPositionResults[0]).toHaveProperty('position');
      expect(result.perPositionResults[0]).toHaveProperty('cardAId');
      expect(result.perPositionResults[0]).toHaveProperty('cardBId');
      expect(result.perPositionResults[0]).toHaveProperty('statA');
      expect(result.perPositionResults[0]).toHaveProperty('statB');
      expect(result.perPositionResults[0]).toHaveProperty('winner');
    });
  });

  describe('matchId flow', () => {
    it('should fetch lineups from DB and update match record', async () => {
      const matchId = 'match-123';
      const lineupA = { id: 'lineup-A', slots: { PG: 'card-1' }, userId: 'user-1', aggregateMomentum: 0 };
      const lineupB = { id: 'lineup-B', slots: { PG: 'card-2' }, userId: 'user-2', aggregateMomentum: 0 };

      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        lineupA,
        lineupB,
        matchSeed: 'test-seed',
        status: 'pending',
        resolutionResults: null,
      });

      mockPrismaService.card.findMany.mockResolvedValue([
        { id: 'card-1', playerStats: 85, marketValueCents: 1000 },
        { id: 'card-2', playerStats: 75, marketValueCents: 1000 },
      ]);

      await service.resolveMatch({ matchId } as any, 'user-1');

      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: matchId },
        include: { lineupA: true, lineupB: true },
      });

      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: matchId },
        data: expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date),
          resolutionResults: expect.any(Object),
        }),
      });
    });

    it('should return stored results if match already resolved', async () => {
      const matchId = 'match-123';
      const storedResults = {
        winner: 'A',
        scoreA: 1,
        scoreB: 0,
        perPositionResults: [],
        events: [],
        matchSeed: 'test-seed',
        resolvedAt: new Date('2026-01-01'),
      };

      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        lineupA: { id: 'lineup-A', slots: { PG: 'card-1' }, userId: 'user-1' },
        lineupB: { id: 'lineup-B', slots: { PG: 'card-2' }, userId: 'user-2' },
        matchSeed: 'test-seed',
        status: 'completed',
        resolutionResults: storedResults,
      });

      const result = await service.resolveMatch({ matchId } as any, 'user-1');

      expect(result.winner).toBe('A');
      expect(result.resolvedAt).toBeInstanceOf(Date);
      expect(mockPrismaService.card.findMany).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if non-owner accesses match', async () => {
      const matchId = 'match-123';

      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        lineupA: { id: 'lineup-A', slots: { PG: 'card-1' }, userId: 'user-1' },
        lineupB: { id: 'lineup-B', slots: { PG: 'card-2' }, userId: 'user-2' },
        matchSeed: 'test-seed',
        status: 'pending',
        resolutionResults: null,
      });

      await expect(service.resolveMatch({ matchId } as any, 'user-3')).rejects.toThrow('You do not have permission to resolve this match');
    });
  });
});
