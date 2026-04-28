import { Injectable } from '@nestjs/common';
import { CVService, OCRResult } from './cv.service';

@Injectable()
export class MockCVAdapter extends CVService {
  async extractOCR(imageBuffer: Buffer): Promise<OCRResult> {
    // Return deterministic mock output for tests
    return {
      text: 'MOCK OCR TEXT: 2018 Topps Marcus Ramirez #42',
      candidates: [
        { name: 'Marcus Ramirez', year: 2018, set: 'Topps', confidence: 0.99 }
      ],
    };
  }
}
