import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUploadUrlsDto {
  @IsNotEmpty()
  @IsString()
  frontFileName: string;

  @IsOptional()
  @IsString()
  backFileName?: string;
}
