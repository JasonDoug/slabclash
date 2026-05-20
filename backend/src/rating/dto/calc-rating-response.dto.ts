export class RatingBreakdownItem {
  factor: string;
  inputValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  normalizationBounds: { min: number; max: number };
}

export class CalcRatingResponseDto {
  powerScore: number;
  ratingConfigVersion: string;
  breakdown: RatingBreakdownItem[];
}
