import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { CVService } from './cv/cv.service';
import * as imghash from 'imghash';

jest.mock('imghash');

describe('IngestionService', () => {
  let service: IngestionService;
  let prisma: PrismaService;
  let s3Service: S3Service;
  let cvService: CVService;

  const mockPrismaService = {
    cardIngestionJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockS3Service = {
    getPresignedUploadUrl: jest.fn(),
    downloadObject: jest.fn(),
  };

  const mockCVService = {
    extractOCR: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: CVService, useValue: mockCVService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
    cvService = module.get<CVService>(CVService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUploadUrls', () => {
    it('should create a job and return presigned URLs', async () => {
      const userId = 'user-1';
      const frontFileName = 'front.jpg';
      const backFileName = 'back.jpg';
      
      mockS3Service.getPresignedUploadUrl.mockResolvedValueOnce('http://upload-front');
      mockS3Service.getPresignedUploadUrl.mockResolvedValueOnce('http://upload-back');
      
      mockPrismaService.cardIngestionJob.create.mockResolvedValue({
        id: 'job-1',
        userId,
        imageFrontKey: 'key-front',
        imageBackKey: 'key-back',
        status: 'uploaded',
      });

      const result = await service.createUploadUrls(userId, frontFileName, backFileName);

      expect(result.scanJobId).toBeDefined();
      expect(result.uploadUrlFront).toBe('http://upload-front');
      expect(result.uploadUrlBack).toBe('http://upload-back');
    });
  });

  describe('processScanJob', () => {
    it('should process a scan job correctly', async () => {
      const userId = 'user-1';
      const scanJobId = 'job-1';
      const mockBuffer = Buffer.from('fake-image');
      
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({
        id: scanJobId,
        userId,
        imageFrontKey: 'key-front',
        status: 'uploaded',
      });

      mockS3Service.downloadObject.mockResolvedValue(mockBuffer);
      mockCVService.extractOCR.mockResolvedValue({
        text: 'EXTRACTED TEXT',
        candidates: [{ name: 'Test Card' }],
      });
      (imghash.hash as jest.Mock).mockResolvedValue('f1f1f1f1');

      mockPrismaService.cardIngestionJob.update.mockResolvedValue({
        id: scanJobId,
        status: 'awaiting_user_confirm',
        ocrText: 'EXTRACTED TEXT',
        phash: 'f1f1f1f1',
      });

      const result = await service.processScanJob(userId, scanJobId);

      expect(result.status).toBe('awaiting_user_confirm');
      expect(result.ocrText).toBe('EXTRACTED TEXT');
      expect(result.phash).toBe('f1f1f1f1');
      expect(mockS3Service.downloadObject).toHaveBeenCalledWith('key-front');
      expect(mockCVService.extractOCR).toHaveBeenCalledWith(mockBuffer);
      expect(imghash.hash).toHaveBeenCalledWith(mockBuffer);
    });

    it('should throw ForbiddenException if user does not own job', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({
        id: 'job-1',
        userId: 'other-user',
      });

      await expect(service.processScanJob('user-1', 'job-1')).rejects.toThrow();
    });
  });
});
