import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { InMemoryRealtimeService } from '../src/realtime/in-memory-realtime.service';
import { MatchType } from '../src/matchmaking/dto/enqueue-matchmaking.dto';
import { MatchmakingService } from '../src/matchmaking/matchmaking.service';

describe('Match Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let realtimeService: InMemoryRealtimeService;

  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;
  let lineupA: any;
  let lineupB: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    realtimeService = app.get<InMemoryRealtimeService>(InMemoryRealtimeService);
    const redis = app.get('REDIS_CLIENT');
    await redis.select(15);
    await redis.flushdb();

    // Cleanup
    await prisma.match.deleteMany();
    await prisma.ratingJob.deleteMany();
    await prisma.cardIngestionJob.deleteMany();
    await prisma.lineup.deleteMany();
    await prisma.card.deleteMany();
    await prisma.player.deleteMany();
    await prisma.user.deleteMany();

    // Setup Users
    const signupA = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        username: `userA_${Date.now()}`,
        email: `a_${Date.now()}@test.com`,
        password: 'Password123!',
      })
      .expect(201);
    userA = signupA.body;

    const loginA = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: userA.email, password: 'Password123!' })
      .expect(200);
    tokenA = loginA.body.accessToken;

    const signupB = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        username: `userB_${Date.now()}`,
        email: `b_${Date.now()}@test.com`,
        password: 'Password123!',
      })
      .expect(201);
    userB = signupB.body;

    const loginB = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: userB.email, password: 'Password123!' })
      .expect(200);
    tokenB = loginB.body.accessToken;

    // Setup Players & Cards
    const player = await prisma.player.create({
      data: { name: `Superstar_${Date.now()}` },
    });

    const cardA = await prisma.card.create({
      data: {
        userId: userA.id,
        playerId: player.id,
        year: 2024,
        setName: 'Test',
        conditionReported: 'mint',
        rarity: 'rare',
        powerScore: 800,
        playerStats: 90,
        imageFrontKey: 'key-a',
      },
    });

    const cardB = await prisma.card.create({
      data: {
        userId: userB.id,
        playerId: player.id,
        year: 2024,
        setName: 'Test',
        conditionReported: 'mint',
        rarity: 'rare',
        powerScore: 800,
        playerStats: 85,
        imageFrontKey: 'key-b',
      },
    });

    // Setup Lineups
    const resLineupA = await request(app.getHttpServer())
      .post('/v1/lineups')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Lineup A', slots: { PG: cardA.id } })
      .expect(201);
    lineupA = resLineupA.body;

    const resLineupB = await request(app.getHttpServer())
      .post('/v1/lineups')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Lineup B', slots: { PG: cardB.id } })
      .expect(201);
    lineupB = resLineupB.body;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete a full match flow between two users', async () => {
    const eventsA: any[] = [];
    const eventsB: any[] = [];

    realtimeService.subscribe(userA.id, (ev) => eventsA.push(eventToPojo(ev)));
    realtimeService.subscribe(userB.id, (ev) => eventsB.push(eventToPojo(ev)));

    // 2. Enqueue both users
    const enqueueARes = await request(app.getHttpServer())
      .post('/v1/matchmaking/enqueue')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lineupId: lineupA.id, matchType: 'casual' });

    expect(enqueueARes.status).toBe(201);

    const enqueueBRes = await request(app.getHttpServer())
      .post('/v1/matchmaking/enqueue')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ lineupId: lineupB.id, matchType: 'casual' });

    expect(enqueueBRes.status).toBe(201);

    // 3. Trigger matchmaking processing
    const matchmakingService = app.get(MatchmakingService);
    await matchmakingService.processQueue();

    // 4. Verify match.found
    await Promise.all([
      waitFor(() => eventsA.some((e) => e.event === 'match.found'), 2000),
      waitFor(() => eventsB.some((e) => e.event === 'match.found'), 2000),
    ]);

    const foundA = eventsA.find((e) => e.event === 'match.found');
    expect(foundA.data.matchId).toBeDefined();
    expect(foundA.data.opponent.userId).toBe(userB.id);

    const matchId = foundA.data.matchId;

    // Simulate match.start
    await matchmakingService.startMatchForTest(userA.id, userB.id, matchId);
    await waitFor(() => eventsA.some((e) => e.event === 'match.start'), 2000);

    // 5. Manual trigger resolution
    await request(app.getHttpServer())
      .post('/v1/match/resolve')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ matchId })
      .expect(201);

    // 6. Verify match.result
    await Promise.all([
      waitFor(() => eventsA.some((e) => e.event === 'match.result'), 10000),
      waitFor(() => eventsB.some((e) => e.event === 'match.result'), 10000),
    ]);

    const resultA = eventsA.find((e) => e.event === 'match.result');
    expect(resultA.data.winner).toBe('A'); // userA won via higher playerStats (90 vs 85), powerScore equal
    expect(resultA.data.scoreA).toBe(1);
    expect(resultA.data.scoreB).toBe(0);

    // 7. Verify DB status
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    expect(match.status).toBe('completed');
    expect(match.winnerLineupId).toBe(lineupA.id);
  }, 30000);

  function eventToPojo(ev: any) {
    return { event: ev.event, data: ev.data };
  }

  async function waitFor(condition: () => boolean, timeout: number) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (condition()) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Timeout waiting for condition');
  }
});
