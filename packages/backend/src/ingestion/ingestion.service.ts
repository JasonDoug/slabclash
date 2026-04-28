import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { randomUUID, createHash } from 'crypto';
import * as mime from 'mime-types';
import { CVService } from './cv/cv.service';
import * as imghash from 'imghash';

@Injectable()
export class IngestionService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private cvService: CVService,
  ) {}

  async createUploadUrls(userId: string, frontFileName: string, backFileName?: string) {
    const scanJobId = randomUUID();
    
    // Generate S3 keys
    const frontKey = `uploads/${userId}/${scanJobId}/front-${frontFileName}`;
    const backKey = backFileName ? `uploads/${userId}/${scanJobId}/back-${backFileName}` : null;

    const frontMimeType = mime.lookup(frontFileName) || 'application/octet-stream';
    const backMimeType = backFileName ? (mime.lookup(backFileName) || 'application/octet-stream') : null;

    // Generate presigned URLs
    const uploadUrlFront = await this.s3Service.getPresignedUploadUrl(frontKey, frontMimeType);
    let uploadUrlBack: string | null = null;
    if (backKey && backMimeType) {
      uploadUrlBack = await this.s3Service.getPresignedUploadUrl(backKey, backMimeType);
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
      throw new ForbiddenException('You do not have permission to process this job');
    }

    if (!job.imageFrontKey) {
      throw new Error('Front image is required for processing');
    }

    // Download front image
    const frontImageBuffer = await this.s3Service.downloadObject(job.imageFrontKey);

    // Run OCR
    const ocrResult = await this.cvService.extractOCR(frontImageBuffer);

    // Compute pHash (with fallback for dev)
    let phash: string;
    try {
      phash = (await imghash.hash(frontImageBuffer)) as string;
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
        candidateMatches: ocrResult.candidates as any,
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
      throw new ForbiddenException('You do not have permission to view this job');
    }

    return job;
  }
}
