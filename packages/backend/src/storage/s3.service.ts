import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import axios from 'axios';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');

    this.s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true, // Needed for MinIO/LocalStack
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      maxAttempts: 1, // Avoid dynamic import in retry middleware
    });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    try {
      // URL expires in 15 minutes
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for key ${key}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      // URL expires in 15 minutes
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned download URL for key ${key}`,
        error.stack,
      );
      throw error;
    }
  }

  async downloadObject(key: string): Promise<Buffer> {
    const url = await this.getPresignedDownloadUrl(key);
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Failed to download object from URL for key ${key}`,
        error.stack,
      );
      throw error;
    }
  }
}
