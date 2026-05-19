import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../app.module';
import { MatchmakingService } from './matchmaking.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchType } from './dto/enqueue-matchmaking.dto';

describe('Matchmaking Integration', () => {
  let app: INestApplication;
  let matchmakingService: MatchmakingService;
  let prisma: PrismaClient;
  let redis: Redis;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    matchmakingService =
      moduleFixture.get<MatchmakingService>(MatchmakingService);
    const prismaService = moduleFixture.get<PrismaService>(PrismaService);
    prisma = prismaService;
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  });

  beforeEach(async () => {
    const keys = await redis.keys('matchmaking:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await prisma.match.deleteMany();
    await prisma.lineup.deleteMany();
    await prisma.card.deleteMany();
    await prisma.player.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await redis.quit();
    await prisma.$disconnect();
    await app.close();
  });

  it('should enqueue two users and create a match', async () => {
    const user1 = await prisma.user.create({
      data: {
        username: 'player1',
        email: 'player1@test.com',
        passwordHash: 'hash1',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        username: 'player2',
        email: 'player2@test.com',
        passwordHash: 'hash2',
      },
    });

    const player = await prisma.player.create({
      data: { name: 'Test Player' },
    });

    const card1 = await prisma.card.create({
      data: {
        userId: user1.id,
        playerId: player.id,
        year: 2023,
        setName: 'Test Set',
        conditionReported: 'mint',
        rarity: 'rare',
        powerScore: 150,
        imageFrontKey: 'key1',
        ingestionStatus: 'verified',
      },
    });

    const card2 = await prisma.card.create({
      data: {
        userId: user2.id,
        playerId: player.id,
        year: 2023,
        setName: 'Test Set',
        conditionReported: 'mint',
        rarity: 'rare',
        powerScore: 155,
        imageFrontKey: 'key2',
        ingestionStatus: 'verified',
      },
    });

    const lineup1 = await prisma.lineup.create({
      data: {
        userId: user1.id,
        name: 'Lineup 1',
        slots: { striker: card1.id },
        aggregatePowerScore: 150,
        rarityCounts: { rare: 1 },
      },
    });

    const lineup2 = await prisma.lineup.create({
      data: {
        userId: user2.id,
        name: 'Lineup 2',
        slots: { striker: card2.id },
        aggregatePowerScore: 155,
        rarityCounts: { rare: 1 },
      },
    });

    const result1 = await matchmakingService.enqueue(
      user1.id,
      lineup1.id,
      MatchType.casual,
    );
    expect(result1.queued).toBe(true);

    const result2 = await matchmakingService.enqueue(
      user2.id,
      lineup2.id,
      MatchType.casual,
    );
    expect(result2.queued).toBe(true);

    const processResult = await matchmakingService.processQueue();
    expect(processResult.matches).toBe(1);

    const matches = await prisma.match.findMany();
    expect(matches.length).toBe(1);
    expect(matches[0].matchType).toBe(MatchType.casual);
    expect([matches[0].lineupAId, matches[0].lineupBId]).toContain(lineup1.id);
    expect([matches[0].lineupAId, matches[0].lineupBId]).toContain(lineup2.id);
  });

  it('should return correct queue status', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'player3',
        email: 'player3@test.com',
        passwordHash: 'hash3',
      },
    });

    const player = await prisma.player.create({
      data: { name: 'Test Player 2' },
    });

    const card = await prisma.card.create({
      data: {
        userId: user.id,
        playerId: player.id,
        year: 2023,
        setName: 'Test Set',
        conditionReported: 'mint',
        rarity: 'rare',
        powerScore: 200,
        imageFrontKey: 'key3',
        ingestionStatus: 'verified',
      },
    });

    const lineup = await prisma.lineup.create({
      data: {
        userId: user.id,
        name: 'Lineup 3',
        slots: { striker: card.id },
        aggregatePowerScore: 200,
        rarityCounts: { rare: 1 },
      },
    });

    let status = await matchmakingService.getStatus(user.id);
    expect(status.inQueue).toBe(false);

    await matchmakingService.enqueue(user.id, lineup.id, MatchType.ranked);

    status = await matchmakingService.getStatus(user.id);
    expect(status.inQueue).toBe(true);
    expect(status.matchType).toBe(MatchType.ranked);
    expect(status.queuePosition).toBeDefined();
  });
});
