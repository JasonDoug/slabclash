import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsNotEmptyObject,
} from 'class-validator';

export class CreateLineupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmptyObject()
  slots: Record<string, string>;
}
