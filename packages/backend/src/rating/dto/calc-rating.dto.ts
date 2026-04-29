import { Rarity } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CardInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  playerStats: number;

  @IsOptional()
  @IsNumber()
  marketValueCents?: number;

  @IsEnum(Rarity)
  rarity: Rarity;

  @IsOptional()
  @IsNumber()
  conditionEstimatedScore?: number;

  @IsOptional()
  @IsNumber()
  momentum?: number;
}

export class CalcRatingDto {
  @ValidateNested()
  @Type(() => CardInput)
  card: CardInput;

  @IsOptional()
  @IsString()
  ratingConfigVersion?: string;
}
