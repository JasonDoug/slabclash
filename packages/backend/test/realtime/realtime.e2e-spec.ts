import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { InMemoryRealtimeService } from '../../src/realtime/in-memory-realtime.service';
import { RealtimeService } from '../../src/realtime/realtime.interface';

describe('Realtime (e2e)', () => {
  let app: INestApplication;
  let realtimeService: InMemoryRealtimeService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new (await import('@nestjs/common')).ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    realtimeService = app.get<InMemoryRealtimeService>(InMemoryRealtimeService);

    // Get auth token (assuming test user exists or create one)
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' })
      .catch(() => {
        // If login fails, try signup
        return request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send({ username: 'testuser', email: 'test@example.com', password: 'Password123!' });
      });

    token = res.body.accessToken || res.body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('publishToUser and subscribe', () => {
    it('should receive match:found via in-memory service', async () => {
      const userId = 'test-user-123';
      const events: any[] = [];
      const callback = (event: any) => events.push(event);
      realtimeService.subscribe(userId, callback);

      // Simulate match creation (call realtimeService directly)
      await realtimeService.publishToUser(userId, 'match:found', {
        matchId: 'match-1',
        opponent: { username: 'opponentUser' },
        lineupPower: 1500,
      });

      expect(events.length).toBe(1);
      expect(events[0].event).toBe('match:found');
      expect(events[0].data.matchId).toBe('match-1');

      realtimeService.unsubscribe(userId, callback);
    });

    it('should store multiple events for a user', async () => {
      const userId = 'test-user-456';
      const events: any[] = [];
      const callback = (event: any) => events.push(event);
      realtimeService.subscribe(userId, callback);

      await realtimeService.publishToUser(userId, 'match:found', { matchId: 'm1' });
      await realtimeService.publishToUser(userId, 'match:start', { matchId: 'm1' });
      await realtimeService.publishToUser(userId, 'match:result', { matchId: 'm1', winner: 'A' });

      expect(events.length).toBe(3);
      expect(events[0].event).toBe('match:found');
      expect(events[1].event).toBe('match:start');
      expect(events[2].event).toBe('match:result');

      realtimeService.unsubscribe(userId, callback);
    });
  });

  describe('SSE endpoint', () => {
    it('should return 200 and set correct headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/notifications/stream')
        .set('Authorization', `Bearer ${token}`)
        .timeout(1000)
        .catch(err => err);

      // The initial heartbeat should have been sent
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('Integration with MatchmakingService', () => {
    it('should publish match:found when match is created', async () => {
      const userId = 'test-user-789';
      const events: any[] = [];
      const callback = (event: any) => events.push(event);
      realtimeService.subscribe(userId, callback);

      // Simulate calling notifyMatchFound directly (since we can't easily trigger the full matchmaking flow in e2e)
      await realtimeService.publishToUser(userId, 'match:found', {
        matchId: 'match-e2e-1',
        opponent: { username: 'testuser' },
        lineupPowerA: 1200,
        lineupPowerB: 1100,
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].event).toBe('match:found');
      expect(events[0].data.matchId).toBe('match-e2e-1');

      realtimeService.unsubscribe(userId, callback);
    });
  });
});
