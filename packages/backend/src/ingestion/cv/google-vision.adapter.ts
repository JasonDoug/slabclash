import { Injectable, Logger } from '@nestjs/common';
import { CVService, OCRResult } from './cv.service';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleVisionAdapter extends CVService {
  private client: ImageAnnotatorClient;
  private readonly logger = new Logger(GoogleVisionAdapter.name);

  constructor(private configService: ConfigService) {
    super();
    const credentialsJson = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
    );
    if (credentialsJson) {
      try {
        const credentials = JSON.parse(credentialsJson);
        this.client = new ImageAnnotatorClient({ credentials });
      } catch (e) {
        this.logger.error(
          'Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON',
        );
      }
    } else {
      // Fallback to default auth if file path is provided via env var GOOGLE_APPLICATION_CREDENTIALS
      this.client = new ImageAnnotatorClient();
    }
  }

  async extractOCR(imageBuffer: Buffer): Promise<OCRResult> {
    this.logger.log('Calling Google Vision API...');
    const [result] = await this.client.textDetection(imageBuffer);
    const text = result.fullTextAnnotation?.text || '';

    // In a real implementation, we might also extract entities or labels
    return {
      text,
      candidates: [],
    };
  }
}
