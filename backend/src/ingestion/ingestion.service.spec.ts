import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { CVService } from './cv/cv.service';
import { MatchCandidateService } from './match-candidate.service';
import { RatingService } from '../rating/rating.service';
import { CardService } from '../card/card.service';
import { AntiFraudService } from './anti-fraud.service';
import { IngestionStatus, ConditionReported } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('IngestionService', () => {
  let service: IngestionService;
  let prisma: PrismaService;
  let s3Service: S3Service;
  let cvService: CVService;
  let cardService: CardService;

  const mockPrismaService = {
    cardIngestionJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    player: {
      findUnique: jest.fn(),
    },
    card: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    dispute: {
      create: jest.fn(),
    },
  };

  const mockS3Service = {
    getPresignedUploadUrl: jest.fn(),
    downloadObject: jest.fn(),
  };

  const mockCVService = {
    extractOCR: jest.fn(),
  };

  const mockMatchCandidateService = {
    findCandidates: jest.fn(),
  };

  const mockRatingService = {
    calculate: jest.fn(),
    scheduleRating: jest.fn(),
  };

  const mockAntiFraudService = {
    checkDuplicate: jest.fn(),
  };

  const mockRealtimeService = {
    publishToUser: jest.fn(),
  };

  const mockCardService = {
    createCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: CVService, useValue: mockCVService },
        { provide: MatchCandidateService, useValue: mockMatchCandidateService },
        { provide: RatingService, useValue: mockRatingService },
        { provide: CardService, useValue: mockCardService },
        { provide: AntiFraudService, useValue: mockAntiFraudService },
        { provide: 'RealtimeService', useValue: mockRealtimeService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
    cvService = module.get<CVService>(CVService);
    cardService = module.get<CardService>(CardService);
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
      mockPrismaService.cardIngestionJob.create.mockResolvedValue({
        id: 'job-1',
      });
      mockS3Service.getPresignedUploadUrl.mockResolvedValue(
        'http://upload.url',
      );

      const result = await service.createUploadUrls(userId, frontFileName);

      expect(result.scanJobId).toBe('job-1');
      expect(result.uploadUrlFront).toBe('http://upload.url');
      expect(mockPrismaService.cardIngestionJob.create).toHaveBeenCalled();
    });
  });

  describe('processScanJob', () => {
    const userId = 'user-1';
    const scanJobId = 'job-1';

    it('should process a scan job correctly', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({
        id: scanJobId,
        userId,
        imageFrontKey: 'front-key',
      });
      mockS3Service.downloadObject.mockResolvedValue(Buffer.from('image'));
      mockCVService.extractOCR.mockResolvedValue({ text: 'OCR TEXT' });
      mockMatchCandidateService.findCandidates.mockResolvedValue([]);
      mockPrismaService.cardIngestionJob.update.mockResolvedValue({
        id: scanJobId,
      });

      await service.processScanJob(userId, scanJobId);

      expect(mockCVService.extractOCR).toHaveBeenCalled();
      expect(mockPrismaService.cardIngestionJob.update).toHaveBeenCalledWith({
        where: { id: scanJobId },
        data: expect.objectContaining({
          status: 'awaiting_user_confirm',
          ocrText: 'OCR TEXT',
        }),
      });
    });

    it('should throw ForbiddenException if user does not own job', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({
        id: scanJobId,
        userId: 'other-user',
      });

      await expect(service.processScanJob(userId, scanJobId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('confirmScanJob', () => {
    const userId = 'user-1';
    const scanJobId = 'job-1';
    const playerId = 'player-1';

    beforeEach(() => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({
        id: scanJobId,
        userId,
        status: 'awaiting_user_confirm',
        imageFrontKey: 'front-key',
        imageBackKey: 'back-key',
        phash: 'abc123',
        ocrText: 'SOME OCR TEXT',
        candidateMatches: [{ playerId, confidence: 0.9 }],
      });

      mockPrismaService.player.findUnique.mockResolvedValue({
        id: playerId,
        name: 'Test Player',
      });
      mockCardService.createCard.mockResolvedValue({ id: 'card-1' });
      mockPrismaService.card.findUnique.mockResolvedValue({
        id: 'card-1',
        rarity: 'common',
        playerStats: 80,
        marketValueCents: 5000,
        conditionEstimatedScore: 9,
      });
      mockPrismaService.cardIngestionJob.update.mockResolvedValue({});
      mockAntiFraudService.checkDuplicate.mockResolvedValue({
        isDuplicate: false,
      });
    });

    it('should create Card record and update job status on confirm', async () => {
      mockRatingService.calculate.mockResolvedValue({
        powerScore: 750,
        ratingConfigVersion: 'v1',
        breakdown: [],
      });

      const result = await service.confirmScanJob(
        userId,
        scanJobId,
        playerId,
        2024,
        'Topps',
        undefined,
        ConditionReported.near_mint,
        true,
      );

      expect(mockCardService.createCard).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          playerId,
          year: 2024,
          setName: 'Topps',
          conditionReported: ConditionReported.near_mint,
          ingestionStatus: 'verified',
        }),
      );

      expect(mockPrismaService.cardIngestionJob.update).toHaveBeenCalledWith({
        where: { id: scanJobId },
        data: { status: 'verified' },
      });

      expect(result.cardId).toBe('card-1');
    });

    it('should schedule rating job when powerScore calculation fails', async () => {
      mockRatingService.calculate.mockRejectedValue(
        new Error('Rating calculation failed'),
      );

      await service.confirmScanJob(
        userId,
        scanJobId,
        playerId,
        2024,
        'Topps',
        undefined,
        ConditionReported.near_mint,
        true,
      );

      expect(mockRatingService.scheduleRating).toHaveBeenCalledWith('card-1');
    });
  });
});
