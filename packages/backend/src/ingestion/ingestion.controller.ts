import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUploadUrlsDto } from './dto/create-upload-urls.dto';

@Controller('v1/scan')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  async upload(@Request() req, @Body() dto: CreateUploadUrlsDto) {
    return this.ingestionService.createUploadUrls(
      req.user.id,
      dto.frontFileName,
      dto.backFileName,
    );
  }
}
