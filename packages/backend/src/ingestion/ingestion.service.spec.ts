import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { CVService } from './cv/cv.service';
import { MatchCandidateService } from './match-candidate.service';
import { RatingService } from '../rating/rating.service';
import { CardService } from '../card/card.service';
import { ForbiddenException } from '@nestjs/common';
import * as imghash from 'imghash';
import { ConditionReported } from '@prisma/client';

jest.mock('imghash');

describe('IngestionService', () => {
  let service: IngestionService;
  let prisma: PrismaService;
  let s3Service: S3Service;
  let cvService: CVService;
  let cardService: CardService;

  const mockPrismaService: any = {
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
      const backFileName = 'back.jpg';

      mockS3Service.getPresignedUploadUrl.mockResolvedValueOnce(
        'http://upload-front',
      );
      mockS3Service.getPresignedUploadUrl.mockResolvedValueOnce(
        'http://upload-back',
      );

      mockPrismaService.cardIngestionJob.create.mockResolvedValue({
        id: 'job-1',
        userId,
        imageFrontKey: 'key-front',
        imageBackKey: 'key-back',
        status: 'uploaded',
      });

      const result = await service.createUploadUrls(
        userId,
        frontFileName,
        backFileName,
      );

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
      mockMatchCandidateService.findCandidates.mockResolvedValue([
        { playerId: 'p1', playerName: 'Test Card', confidence: 0.9 },
      ]);
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
    });

    it('should throw ForbiddenException if user does not own job', async () => {
      mockPrismaService.cardIngestionJob.findUnique.mockResolvedValue({
        id: 'job-1',
        userId: 'other-user',
      });

      await expect(service.processScanJob('user-1', 'job-1')).rejects.toThrow();
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
      mockRatingService.calculate.mockRejectedValue(new Error('Rating calculation failed'));

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
