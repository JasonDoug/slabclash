import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from './matchmaking.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchType } from './dto/enqueue-matchmaking.dto';
import { MatchEngineService } from '../match-engine/match-engine.service';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let mockPrismaService: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockPrismaService = {
      lineup: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      match: {
        create: jest.fn(),
      },
    };

    mockRedis = {
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrange: jest.fn(),
      zrank: jest.fn(),
      zcard: jest.fn(),
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      eval: jest.fn(),
    };

    const mockRealtimeService = {
      publishToUser: jest.fn(),
    };

    const mockMatchEngineService = {
      resolveMatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: 'RealtimeService', useValue: mockRealtimeService },
        { provide: MatchEngineService, useValue: mockMatchEngineService },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
  });

  describe('getPowerBin', () => {
    it('should return correct power bin for given score', () => {
      expect(service.getPowerBin(120)).toBe(2); // floor(120/50) = 2
      expect(service.getPowerBin(49)).toBe(0); // floor(49/50) = 0
      expect(service.getPowerBin(50)).toBe(1); // floor(50/50) = 1
      expect(service.getPowerBin(99)).toBe(1); // floor(99/50) = 1
      expect(service.getPowerBin(2500)).toBe(50); // floor(2500/50) = 50
    });
  });

  describe('getQueueKey', () => {
    it('should return correct queue key format', () => {
      expect(service.getQueueKey('casual', 2)).toBe('matchmaking:casual:bin:2');
      expect(service.getQueueKey('ranked', 10)).toBe('matchmaking:ranked:bin:10');
    });
  });

  describe('getTolerance', () => {
    it('should return correct tolerance for match types', () => {
      expect(service.getTolerance(MatchType.casual)).toBe(0.05); // 5%
      expect(service.getTolerance(MatchType.ranked)).toBe(0.02); // 2%
    });
  });

  describe('enqueue', () => {
    it('should enqueue a user successfully', async () => {
      const mockLineup = {
        id: 'lineup-1',
        userId: 'user-1',
        aggregatePowerScore: 120,
      };

      mockPrismaService.lineup.findFirst.mockResolvedValue(mockLineup);
      mockRedis.get.mockResolvedValue(null); // Not already in queue
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.zrank.mockResolvedValue(0);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.enqueue('user-1', 'lineup-1', MatchType.casual);

      expect(result.queued).toBe(true);
      expect(result.queuePosition).toBe(1);
      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'matchmaking:casual:bin:2',
        expect.any(Number),
        'user-1:lineup-1',
      );
    });

    it('should throw NotFoundException if lineup not found', async () => {
      mockPrismaService.lineup.findFirst.mockResolvedValue(null);

      await expect(service.enqueue('user-1', 'lineup-1', MatchType.casual)).rejects.toThrow(
        'Lineup not found or does not belong to user',
      );
    });

    it('should throw BadRequestException if user already in queue', async () => {
      const mockLineup = {
        id: 'lineup-1',
        userId: 'user-1',
        aggregatePowerScore: 120,
      };

      mockPrismaService.lineup.findFirst.mockResolvedValue(mockLineup);
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ lineupId: 'lineup-1', matchType: MatchType.casual }),
      );

      await expect(service.enqueue('user-1', 'lineup-1', MatchType.casual)).rejects.toThrow(
        'User already in matchmaking queue',
      );
    });
  });

  describe('getStatus', () => {
    it('should return inQueue false if user not in queue', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getStatus('user-1');

      expect(result.inQueue).toBe(false);
    });

    it('should return queue status if user in queue', async () => {
      const entryData = JSON.stringify({
        lineupId: 'lineup-1',
        matchType: 'casual',
        powerBin: 2,
        timestamp: 123456789,
      });

      mockRedis.get.mockResolvedValue(entryData);
      mockRedis.zrank.mockResolvedValue(0);

      const result = await service.getStatus('user-1');

      expect(result.inQueue).toBe(true);
      expect(result.matchType).toBe('casual');
      expect(result.queuePosition).toBe(1);
      expect(result.powerBin).toBe(2);
    });
  });
});
