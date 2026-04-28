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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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

  it('should generate presigned URLs and allow upload', async () => {
    const frontFileName = 'test-front.jpg';
    
    const uploadRes = await request(app.getHttpServer())
      .post('/v1/scan/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ frontFileName })
      .expect(201);

    expect(uploadRes.body).toHaveProperty('scanJobId');
    expect(uploadRes.body).toHaveProperty('uploadUrlFront');
    
    const { uploadUrlFront, scanJobId } = uploadRes.body;

    // Test the presigned URL by uploading a dummy file
    const fileContent = Buffer.from('fake-image-content');
    
    // Use axios to PUT the file
    // Note: We need to handle potential network errors if MinIO is not running
    try {
      const putRes = await axios.put(uploadUrlFront, fileContent, {
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });
      expect(putRes.status).toBe(200);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('MinIO is not running, skipping upload verification');
      } else {
        throw error;
      }
    }

    // Verify job exists in DB
    const job = await prisma.cardIngestionJob.findUnique({
      where: { id: scanJobId },
    });
    expect(job).toBeDefined();
    expect(job.status).toBe('uploaded');
    expect(job.userId).toBe(userId);
  });
});
