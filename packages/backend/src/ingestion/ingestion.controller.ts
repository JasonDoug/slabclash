import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Get,
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUploadUrlsDto } from './dto/create-upload-urls.dto';
import { ConfirmScanDto } from './dto/confirm-scan.dto';

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

  @UseGuards(JwtAuthGuard)
  @Post('process/:scanJobId')
  async process(@Request() req, @Param('scanJobId') scanJobId: string) {
    // For now, only the owner can process. In future, admins might too.
    return this.ingestionService.processScanJob(req.user.id, scanJobId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:scanJobId')
  async getStatus(@Request() req, @Param('scanJobId') scanJobId: string) {
    return this.ingestionService.getScanJobStatus(req.user.id, scanJobId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm/:scanJobId')
  async confirm(
    @Request() req,
    @Param('scanJobId') scanJobId: string,
    @Body() dto: ConfirmScanDto,
  ) {
    return this.ingestionService.confirmScanJob(
      req.user.id,
      scanJobId,
      dto.playerId,
      dto.year,
      dto.setName,
      dto.variant,
      dto.conditionReported,
      dto.confirm,
    );
  }
}
