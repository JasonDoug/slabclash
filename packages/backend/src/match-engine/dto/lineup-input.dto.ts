import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LineupInputDto {
  @IsNotEmpty()
  slots: Record<string, string>;

  @IsOptional()
  @IsNumber()
  aggregateMomentum?: number;
}
