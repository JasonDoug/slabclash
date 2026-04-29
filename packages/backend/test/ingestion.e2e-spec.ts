import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import axios from 'axios';

describe('Ingestion (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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

    // Create a test user
    const username = `testuser_${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ username, email, password });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    accessToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.cardIngestionJob.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('should generate presigned URLs, allow upload, and process OCR', async () => {
    const frontFileName = 'test-front.png';

    // 1. Get presigned URL
    const uploadRes = await request(app.getHttpServer())
      .post('/v1/scan/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ frontFileName })
      .expect(201);

    const { uploadUrlFront, scanJobId } = uploadRes.body;

    // 2. Upload a real tiny PNG (8x8 black pixel)
    const fileContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEUAAAD///+l2Z/dAAAADklEQVQI12NgYAgAYgYAAXAA8fX9f78AAAAASUVORK5CYII=',
      'base64',
    );

    try {
      await axios.put(uploadUrlFront, fileContent, {
        headers: { 'Content-Type': 'image/png' },
      });

      // 3. Process the job
      const processRes = await request(app.getHttpServer())
        .post(`/v1/scan/process/${scanJobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(processRes.body.status).toBe('awaiting_user_confirm');
      expect(processRes.body.ocrText).toContain('MOCK OCR TEXT');
      expect(processRes.body.phash).toBeDefined();
      expect(processRes.body.candidateMatches).toBeDefined();
      expect(processRes.body.candidateMatches.length).toBeGreaterThan(0);
      expect(processRes.body.candidateMatches[0].playerName).toBe(
        'Marcus Ramirez',
      );

      // 4. Check status
      const statusRes = await request(app.getHttpServer())
        .get(`/v1/scan/status/${scanJobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statusRes.body.status).toBe('awaiting_user_confirm');
      expect(statusRes.body.ocrText).toBe(processRes.body.ocrText);
      expect(statusRes.body.phash).toBe(processRes.body.phash);
      expect(statusRes.body.candidateMatches[0].playerName).toBe(
        'Marcus Ramirez',
      );

      const playerId = 'test-player-id';
      // Create a player for testing confirmation
      await prisma.player.upsert({
        where: { name: 'Marcus Ramirez' },
        update: {},
        create: { id: playerId, name: 'Marcus Ramirez' },
      });

      // 5. Confirm the scan
      const confirmRes = await request(app.getHttpServer())
        .post(`/v1/scan/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          scanJobId,
          playerId,
          year: 2018,
          setName: 'Topps',
          conditionReported: 'near_mint',
          confirm: true,
        })
        .expect(201);

      expect(confirmRes.body.cardId).toBeDefined();

      // Cleanup player
      await prisma.card.deleteMany({ where: { userId } });
      await prisma.player.delete({ where: { id: playerId } });
    } catch (error) {
      if (error.response?.status === 507) {
        console.warn(
          'MinIO insufficient storage (507), skipping remaining e2e steps',
        );
      } else {
        throw error;
      }
    }
  });
});
