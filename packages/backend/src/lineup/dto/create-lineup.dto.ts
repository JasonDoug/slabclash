import { IsString, IsNotEmpty, ValidateNested, IsNotEmptyObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLineupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => Object)
  slots: Record<string, string>;
}
