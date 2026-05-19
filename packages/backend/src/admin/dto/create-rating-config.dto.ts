import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateRatingConfigDto {
  @IsString()
  @IsNotEmpty()
  version: string;

  @IsObject()
  @IsNotEmpty()
  weights: any;

  @IsObject()
  @IsNotEmpty()
  normalizationBounds: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
