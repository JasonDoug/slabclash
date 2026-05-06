import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateLineupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  slots: Record<string, string>;
}
