import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User, Lineup, Card, Match } from '@prisma/client';

describe('MatchEngine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user
    const username = `testuser_${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({ username, email, password })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await prisma.match.deleteMany({ where: { lineupA: { userId } } });
      await prisma.lineup.deleteMany({ where: { userId } });
      await prisma.card.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app.close();
  });

  describe('POST /v1/match/resolve with raw input', () => {
    let card1: Card, card2: Card, card3: Card, card4: Card;

    beforeEach(async () => {
      // Create cards with known playerStats
      card1 = await prisma.card.create({
        data: {
          userId,
          playerId: (await prisma.player.create({ data: { name: `Player_${Date.now()}_1` } })).id,
          year: 2024,
          setName: 'Test Set',
          variant: 'Base',
          conditionReported: 'mint',
          playerStats: 90,
          marketValueCents: 1000,
          rarity: 'common',
          powerScore: 90,
          imageFrontKey: 'test-key-1',
          ingestionStatus: 'verified',
        },
      });

      card2 = await prisma.card.create({
        data: {
          userId,
          playerId: (await prisma.player.create({ data: { name: `Player_${Date.now()}_2` } })).id,
          year: 2024,
          setName: 'Test Set',
          variant: 'Base',
          conditionReported: 'mint',
          playerStats: 85,
          marketValueCents: 950,
          rarity: 'common',
          powerScore: 85,
          imageFrontKey: 'test-key-2',
          ingestionStatus: 'verified',
        },
      });

      card3 = await prisma.card.create({
        data: {
          userId,
          playerId: (await prisma.player.create({ data: { name: `Player_${Date.now()}_3` } })).id,
          year: 2024,
          setName: 'Test Set',
          variant: 'Base',
          conditionReported: 'mint',
          playerStats: 80,
          marketValueCents: 900,
          rarity: 'common',
          powerScore: 80,
          imageFrontKey: 'test-key-3',
          ingestionStatus: 'verified',
        },
      });

      card4 = await prisma.card.create({
        data: {
          userId,
          playerId: (await prisma.player.create({ data: { name: `Player_${Date.now()}_4` } })).id,
          year: 2024,
          setName: 'Test Set',
          variant: 'Base',
          conditionReported: 'mint',
          playerStats: 70,
          marketValueCents: 850,
          rarity: 'common',
          powerScore: 70,
          imageFrontKey: 'test-key-4',
          ingestionStatus: 'verified',
        },
      });
    });

    afterEach(async () => {
      await prisma.card.deleteMany({ where: { userId } });
      await prisma.player.deleteMany({ where: { name: { contains: 'Player_' } } });
    });

    it('should resolve consistently with same seed', async () => {
      const lineupA = { slots: { PG: card1.id, SG: card2.id } };
      const lineupB = { slots: { PG: card3.id, SG: card4.id } };
      const matchSeed = 'consistent-seed-123';

      const res1 = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lineupA, lineupB, matchSeed })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lineupA, lineupB, matchSeed })
        .expect(201);

      expect(res1.body.winner).toBe(res2.body.winner);
      expect(res1.body.scoreA).toBe(res2.body.scoreA);
      expect(res1.body.scoreB).toBe(res2.body.scoreB);
      expect(res1.body.matchSeed).toBe(matchSeed);
    });

    it('should return per-position results', async () => {
      const lineupA = { slots: { PG: card1.id, SG: card2.id } };
      const lineupB = { slots: { PG: card3.id, SG: card4.id } };

      const res = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lineupA, lineupB, matchSeed: 'test-seed' })
        .expect(201);

      expect(res.body.perPositionResults).toBeInstanceOf(Array);
      expect(res.body.perPositionResults.length).toBe(2);
      expect(res.body.perPositionResults[0]).toHaveProperty('position');
      expect(res.body.perPositionResults[0]).toHaveProperty('cardAId');
      expect(res.body.perPositionResults[0]).toHaveProperty('cardBId');
      expect(res.body.perPositionResults[0]).toHaveProperty('statA');
      expect(res.body.perPositionResults[0]).toHaveProperty('statB');
      expect(res.body.perPositionResults[0]).toHaveProperty('winner');
    });

    it('should return events array', async () => {
      const lineupA = { slots: { PG: card1.id } };
      const lineupB = { slots: { PG: card3.id } };

      const res = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lineupA, lineupB, matchSeed: 'test-seed' })
        .expect(201);

      expect(res.body.events).toBeInstanceOf(Array);
      expect(res.body.events.length).toBeGreaterThan(0);
      expect(res.body.events[0]).toHaveProperty('type');
      expect(res.body.events[0]).toHaveProperty('description');
    });
  });

  describe('POST /v1/match/resolve with matchId', () => {
    let lineupA: Lineup, lineupB: Lineup, match: Match;

    beforeEach(async () => {
      const player = await prisma.player.create({ data: { name: `Player_${Date.now()}` } });

      const cardA1 = await prisma.card.create({
        data: {
          userId, playerId: player.id, year: 2024, setName: 'Test', variant: 'Base',
          conditionReported: 'mint', playerStats: 90, marketValueCents: 1000, rarity: 'common',
          powerScore: 90, imageFrontKey: 'key-a1', ingestionStatus: 'verified',
        },
      });

      const cardB1 = await prisma.card.create({
        data: {
          userId, playerId: player.id, year: 2024, setName: 'Test', variant: 'Base',
          conditionReported: 'mint', playerStats: 80, marketValueCents: 900, rarity: 'common',
          powerScore: 80, imageFrontKey: 'key-b1', ingestionStatus: 'verified',
        },
      });

      lineupA = await prisma.lineup.create({
        data: {
          userId, name: 'Test Lineup A',
          slots: { PG: cardA1.id } as any,
          aggregatePowerScore: 90,
          rarityCounts: {} as any,
        },
      });

      lineupB = await prisma.lineup.create({
        data: {
          userId, name: 'Test Lineup B',
          slots: { PG: cardB1.id } as any,
          aggregatePowerScore: 80,
          rarityCounts: {} as any,
        },
      });

      match = await prisma.match.create({
        data: {
          lineupAId: lineupA.id, lineupBId: lineupB.id,
          matchType: 'casual', matchSeed: 'e2e-seed-123', status: 'pending',
        },
      });
    });

    afterEach(async () => {
      await prisma.match.deleteMany({ where: { id: match?.id } });
      await prisma.lineup.deleteMany({ where: { userId } });
      await prisma.card.deleteMany({ where: { userId } });
      await prisma.player.deleteMany({ where: { name: { contains: 'Player_' } } });
    });

    it('should resolve match and update DB record', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ matchId: match.id })
        .expect(201);

      expect(res.body).toHaveProperty('winner');
      expect(res.body.matchSeed).toBe('e2e-seed-123');

      // Verify DB was updated
      const updatedMatch = await prisma.match.findUnique({ where: { id: match.id } });
      expect(updatedMatch?.status).toBe('completed');
      expect(updatedMatch?.completedAt).not.toBeNull();
      expect(updatedMatch?.resolutionResults).not.toBeNull();
    });

    it('should return stored results on subsequent calls', async () => {
      // First call
      const res1 = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ matchId: match.id })
        .expect(201);

      // Second call should return stored results
      const res2 = await request(app.getHttpServer())
        .post('/v1/match/resolve')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ matchId: match.id })
        .expect(201);

      expect(res2.body.winner).toBe(res1.body.winner);
      expect(res2.body.scoreA).toBe(res1.body.scoreA);
      expect(res2.body.scoreB).toBe(res1.body.scoreB);
    });
  });
});
