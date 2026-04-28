import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { randomUUID } from 'crypto';
import * as mime from 'mime-types';

@Injectable()
export class IngestionService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
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
}
