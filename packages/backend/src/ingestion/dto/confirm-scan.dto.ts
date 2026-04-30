import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export enum ConditionReportedDto {
  mint = 'mint',
  near_mint = 'near_mint',
  excellent = 'excellent',
  good = 'good',
  fair = 'fair',
  poor = 'poor',
}

export class ConfirmScanDto {
  @IsString()
  playerId: string;

  @IsNumber()
  year: number;

  @IsString()
  setName: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsEnum(ConditionReportedDto)
  conditionReported: ConditionReportedDto;

  @IsBoolean()
  confirm: boolean;

  @IsOptional()
  @IsNumber()
  playerStats?: number;

  @IsOptional()
  @IsNumber()
  marketValueCents?: number;
}
