import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';

describe('IngestionService', () => {
  let service: IngestionService;
  let prisma: PrismaService;
  let s3Service: S3Service;

  const mockPrismaService = {
    cardIngestionJob: {
      create: jest.fn(),
    },
  };

  const mockS3Service = {
    getPresignedUploadUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
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
      expect(mockS3Service.getPresignedUploadUrl).toHaveBeenCalledWith(expect.any(String), 'image/jpeg');
      expect(mockPrismaService.cardIngestionJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            status: 'uploaded',
          }),
        }),
      );
    });

    it('should handle missing back image', async () => {
      const userId = 'user-1';
      const frontFileName = 'front.jpg';
      
      mockS3Service.getPresignedUploadUrl.mockResolvedValueOnce('http://upload-front');
      
      mockPrismaService.cardIngestionJob.create.mockResolvedValue({
        id: 'job-1',
        userId,
        imageFrontKey: 'key-front',
        imageBackKey: null,
        status: 'uploaded',
      });

      const result = await service.createUploadUrls(userId, frontFileName);

      expect(result.uploadUrlBack).toBeNull();
      expect(mockS3Service.getPresignedUploadUrl).toHaveBeenCalledWith(expect.any(String), 'image/jpeg');
      expect(mockS3Service.getPresignedUploadUrl).toHaveBeenCalledTimes(1);
    });
  });
});
