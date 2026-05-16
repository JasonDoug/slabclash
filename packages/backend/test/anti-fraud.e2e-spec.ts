import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import axios from 'axios';
import { UserRole } from '@prisma/client';

describe('Anti-Fraud (e2e)', () => {
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

    // Ensure active config exists for deterministic ratings
    await prisma.ratingConfig.upsert({
      where: { version: 'e2e-antifraud' },
      update: { isActive: true },
      create: {
        version: 'e2e-antifraud',
        isActive: true,
        weights: { momentum: 0.1, playerStats: 0.9 },
        normalizationBounds: { momentum: [0, 10], playerStats: [0, 100] },
      },
    });

    // Create a test user
    const username = `antifraud_${Date.now()}`;
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
    if (userId) {
      await prisma.ratingJob.deleteMany();
      await prisma.dispute.deleteMany();
      await prisma.cardIngestionJob.deleteMany({ where: { userId } });
      await prisma.card.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.ratingConfig.deleteMany({ where: { version: 'e2e-antifraud' } });
    await app.close();
  });

  it('should flag duplicate uploads of the same card image', async () => {
    const fileContent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEUAAAD///+l2Z/dAAAADklEQVQI12NgYAgAYgYAAXAA8fX9f78AAAAASUVORK5CYII=',
      'base64',
    );

    const player = await prisma.player.upsert({
      where: { name: 'Marcus Ramirez' },
      update: {},
      create: { name: 'Marcus Ramirez' },
    });

    // 1. Upload first card
    const uploadRes1 = await request(app.getHttpServer())
      .post('/v1/scan/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ frontFileName: 'card1.png' })
      .expect(201);

    const { uploadUrlFront: url1, scanJobId: jobId1 } = uploadRes1.body;
    try {
      await axios.put(url1, fileContent, { headers: { 'Content-Type': 'image/png' } });
      await request(app.getHttpServer())
        .post(`/v1/scan/process/${jobId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/v1/scan/confirm/${jobId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          playerId: player.id,
          year: 2018,
          setName: 'Topps',
          conditionReported: 'mint',
          confirm: true,
        })
        .expect(201);

      // 2. Upload second card (SAME IMAGE -> SAME PHASH)
      const uploadRes2 = await request(app.getHttpServer())
        .post('/v1/scan/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ frontFileName: 'card2.png' })
        .expect(201);

      const { uploadUrlFront: url2, scanJobId: jobId2 } = uploadRes2.body;
      await axios.put(url2, fileContent, { headers: { 'Content-Type': 'image/png' } });
      await request(app.getHttpServer())
        .post(`/v1/scan/process/${jobId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const confirmRes2 = await request(app.getHttpServer())
        .post(`/v1/scan/confirm/${jobId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          playerId: player.id,
          year: 2018,
          setName: 'Topps',
          conditionReported: 'mint',
          confirm: true,
        })
        .expect(201);

      const cardId2 = confirmRes2.body.cardId;
      const card2 = await prisma.card.findUnique({ where: { id: cardId2 } });

      // Verify it was flagged
      expect(card2.ingestionStatus).toBe('flagged');

      // Verify Dispute record exists
      const dispute = await prisma.dispute.findFirst({
        where: { cardId: cardId2 },
      });
      expect(dispute).toBeDefined();
      expect(dispute.reason).toContain('possible duplicate');

    } catch (error) {
      if (error.response?.status === 507) {
        console.warn('MinIO insufficient storage (507), skipping remaining duplicate detection steps');
      } else {
        throw error;
      }
    }
  });

  it('should allow user to manually flag a card', async () => {
    const player = await prisma.player.upsert({
      where: { name: 'Marcus Ramirez' },
      update: {},
      create: { name: 'Marcus Ramirez' },
    });

    // Create a new card first
    const card = await prisma.card.create({
      data: {
        userId,
        playerId: player.id,
        year: 2020,
        setName: 'Manual',
        conditionReported: 'excellent',
        rarity: 'common',
        imageFrontKey: 'manual-key',
        ingestionStatus: 'verified',
      }
    });

    const res = await request(app.getHttpServer())
      .post(`/v1/cards/${card.id}/flag`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Suspicious card details' })
      .expect(201);

    expect(res.body.reason).toBe('Suspicious card details');
    
    const updatedCard = await prisma.card.findUnique({ where: { id: card.id } });
    expect(updatedCard.ingestionStatus).toBe('flagged');
  });
});
