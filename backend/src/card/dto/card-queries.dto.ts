import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ConditionReported, Rarity } from '@prisma/client';

export class UpdateCardMetadataDto {
  @IsOptional()
  @IsString()
  setName?: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsEnum(ConditionReported)
  conditionReported?: ConditionReported;
}

export class ListCardsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(Rarity)
  rarity?: Rarity;

  @IsOptional()
  @IsString()
  setName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  playerId?: string;
}
