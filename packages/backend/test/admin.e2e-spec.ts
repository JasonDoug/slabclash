import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;
  let adminId: string;
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

    // Setup Admin
    const adminEmail = `admin_${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        username: `admin_${Date.now()}`,
        email: adminEmail,
        password: 'Password123!',
      });

    // Promote to Admin
    const adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
    adminId = adminUser.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: 'Password123!' });
    adminToken = adminLogin.body.accessToken;

    // Setup Regular User
    const userEmail = `user_${Date.now()}@test.com`;
    const userSignup = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        username: `user_${Date.now()}`,
        email: userEmail,
        password: 'Password123!',
      });
    userId = userSignup.body.id;

    const userLogin = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: userEmail, password: 'Password123!' });
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.ratingConfig.deleteMany();
    await prisma.user.deleteMany({ where: { id: { in: [adminId, userId] } } });
    await app.close();
  });

  describe('RBAC Protection', () => {
    it('should forbid regular user from accessing admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/ingestion/queue')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admin to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/ingestion/queue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Rating Config Management', () => {
    let configId: string;

    it('should create a new rating config', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/admin/rating-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 'v2-test',
          weights: { momentum: 0.1, playerStats: 0.9 },
          normalizationBounds: {
            momentum: { min: 0, max: 10 },
            playerStats: { min: 0, max: 100 },
            marketValueCents: { min: 0, max: 10000 },
            rarity: { min: 1, max: 5 },
            conditionEstimatedScore: { min: 0, max: 10 },
          },
        })
        .expect(201);

      configId = res.body.id;
      expect(res.body.version).toBe('v2-test');
    });

    it('should activate config and enqueue jobs', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/admin/rating-config/${configId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.activated).toBe('v2-test');
      expect(res.body.enqueuedJobs).toBeDefined();
    });
  });
});
