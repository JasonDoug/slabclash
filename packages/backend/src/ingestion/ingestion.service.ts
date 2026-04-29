import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { RatingService } from '../rating/rating.service';
import { randomUUID, createHash } from 'crypto';
import * as mime from 'mime-types';
import { CVService } from './cv/cv.service';
import * as imghash from 'imghash';
import { MatchCandidateService } from './match-candidate.service';
import { ConditionReported, IngestionStatus } from '@prisma/client';
import { CardService } from '../card/card.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private cvService: CVService,
    private matchCandidateService: MatchCandidateService,
    private ratingService: RatingService,
    private cardService: CardService,
  ) {}

  async createUploadUrls(
    userId: string,
    frontFileName: string,
    backFileName?: string,
  ) {
    const scanJobId = randomUUID();

    // Generate S3 keys
    const frontKey = `uploads/${userId}/${scanJobId}/front-${frontFileName}`;
    const backKey = backFileName
      ? `uploads/${userId}/${scanJobId}/back-${backFileName}`
      : null;

    const frontMimeType =
      mime.lookup(frontFileName) || 'application/octet-stream';
    const backMimeType = backFileName
      ? mime.lookup(backFileName) || 'application/octet-stream'
      : null;

    // Generate presigned URLs
    const uploadUrlFront = await this.s3Service.getPresignedUploadUrl(
      frontKey,
      frontMimeType,
    );
    let uploadUrlBack: string | null = null;
    if (backKey && backMimeType) {
      uploadUrlBack = await this.s3Service.getPresignedUploadUrl(
        backKey,
        backMimeType,
      );
    }

    // Create Ingestion Job in DB
    const job = await this.prisma.cardIngestionJob.create({
      data: {
        id: scanJobId,
        userId: userId,
        imageFrontKey: frontKey,
        imageBackKey: backKey,
        status: 'uploaded',
      },
    });

    return {
      scanJobId: job.id,
      uploadUrlFront,
      uploadUrlBack,
    };
  }

  async processScanJob(userId: string, scanJobId: string, isAdmin = false) {
    const job = await this.prisma.cardIngestionJob.findUnique({
      where: { id: scanJobId },
    });

    if (!job) {
      throw new NotFoundException('Scan job not found');
    }

    if (!isAdmin && job.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to process this job',
      );
    }

    if (!job.imageFrontKey) {
      throw new Error('Front image is required for processing');
    }

    // Download front image
    const frontImageBuffer = await this.s3Service.downloadObject(
      job.imageFrontKey,
    );

    // Run OCR
    const ocrResult = await this.cvService.extractOCR(frontImageBuffer);

    // Find ranked candidates from reference data
    const candidates = await this.matchCandidateService.findCandidates(
      ocrResult.text,
    );

    // Compute pHash (with fallback for dev)
    let phash: string;
    try {
      phash = await imghash.hash(frontImageBuffer);
    } catch (e) {
      // Placeholder pHash using SHA256 for dev/test environments if imghash fails
      phash = createHash('sha256').update(frontImageBuffer).digest('hex');
    }

    // Update job status and store results
    const updatedJob = await this.prisma.cardIngestionJob.update({
      where: { id: scanJobId },
      data: {
        status: 'awaiting_user_confirm',
        ocrText: ocrResult.text,
        phash: phash,
        candidateMatches: candidates as any,
      },
    });

    return updatedJob;
  }

  async getScanJobStatus(userId: string, scanJobId: string, isAdmin = false) {
    const job = await this.prisma.cardIngestionJob.findUnique({
      where: { id: scanJobId },
    });

    if (!job) {
      throw new NotFoundException('Scan job not found');
    }

    if (!isAdmin && job.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this job',
      );
    }

    return job;
  }

  async confirmScanJob(
    userId: string,
    scanJobId: string,
    playerId: string,
    year: number,
    setName: string,
    variant: string | undefined,
    conditionReported: ConditionReported,
    confirm: boolean,
    playerStats?: number,
    marketValueCents?: number,
  ) {
    const job = await this.prisma.cardIngestionJob.findUnique({
      where: { id: scanJobId },
    });

    if (!job) {
      throw new NotFoundException('Scan job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to confirm this job',
      );
    }

    if (job.status !== 'awaiting_user_confirm') {
      throw new ForbiddenException('Scan job is not awaiting confirmation');
    }

    if (!confirm) {
      throw new ForbiddenException('Confirmation required to create card');
    }

    // Verify player exists
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // Determine ingestion status - flag for manual review if condition is poor/fair
    const needsManualReview =
      conditionReported === ConditionReported.poor ||
      conditionReported === ConditionReported.fair;
    const ingestionStatus: IngestionStatus = needsManualReview
      ? 'flagged'
      : 'verified';

    // Build provenance with OCR text and candidate matches
    const provenance = {
      ocrText: job.ocrText,
      candidateMatches: job.candidateMatches,
      confirmedAt: new Date().toISOString(),
    };

    // Create Card record via CardService
    const card = await this.cardService.createCard({
      userId,
      playerId,
      year,
      setName,
      variant,
      conditionReported,
      rarity: 'common', // Default, should be updated based on card details
      provenance,
      imageFrontKey: job.imageFrontKey || '',
      imageBackKey: job.imageBackKey,
      phash: job.phash,
      ingestionStatus,
      playerStats,
      marketValueCents,
    });

    // Update job status
    await this.prisma.cardIngestionJob.update({
      where: { id: scanJobId },
      data: { status: ingestionStatus },
    });

    // Calculate rating using new rating engine
    const cardForRating = await this.prisma.card.findUnique({
      where: { id: card.id },
      select: {
        id: true,
        rarity: true,
        playerStats: true,
        marketValueCents: true,
        conditionEstimatedScore: true,
      },
    });

    if (!cardForRating) {
      throw new NotFoundException('Card not found after creation');
    }

    const ratingDto = {
      card: {
        id: cardForRating.id,
        playerStats: cardForRating.playerStats ?? 50, // Fallback to midpoint of 0-100
        marketValueCents: cardForRating.marketValueCents ?? undefined,
        rarity: cardForRating.rarity,
        conditionEstimatedScore:
          cardForRating.conditionEstimatedScore ?? undefined,
        momentum: 0, // Default, can be updated later
      },
    };

    const powerScore: number | null = null;
    try {
      const ratingResult = await this.ratingService.calculate(ratingDto);
      await this.prisma.card.update({
        where: { id: card.id },
        data: {
          powerScore: ratingResult.powerScore,
          ratingConfigVersion: ratingResult.ratingConfigVersion,
        },
      });
    } catch (e) {
      this.logger.error(
        `Failed to calculate rating for card ${card.id}, scheduling job`,
        e.stack,
      );
      await this.ratingService.scheduleRating(card.id);
    }

    return {
      cardId: card.id,
      powerScore,
    };
  }
}
