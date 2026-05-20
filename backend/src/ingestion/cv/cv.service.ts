export interface OCRResult {
  text: string;
  candidates: any[];
}

export abstract class CVService {
  abstract extractOCR(imageBuffer: Buffer): Promise<OCRResult>;
}
