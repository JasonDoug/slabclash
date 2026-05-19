import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingConfigDto } from './dto/create-rating-config.dto';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('v1/admin/rating-config')
export class AdminRatingController {
  private readonly logger = new Logger(AdminRatingController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getConfigs() {
    return this.prisma.ratingConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async createConfig(@Body() dto: CreateRatingConfigDto) {
    return this.prisma.ratingConfig.create({
      data: {
        version: dto.version,
        weights: dto.weights as Prisma.InputJsonValue,
        normalizationBounds: dto.normalizationBounds as Prisma.InputJsonValue,
        isActive: dto.isActive || false,
      },
    });
  }

  @Post(':id/activate')
  async activateConfig(@Param('id') id: string) {
    // 1. Verify config exists
    const config = await this.prisma.ratingConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new BadRequestException('Rating configuration not found');
    }

    // 2. Set all other configs to inactive and this one to active
    await this.prisma.$transaction([
      this.prisma.ratingConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      this.prisma.ratingConfig.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    // 3. Enqueue batch recalculation jobs for all cards
    // Note: In production, this would be a background job using Bull or similar.
    // For MVP, we insert records into RatingJob for a worker script to process.
    const allCards = await this.prisma.card.findMany({
      select: { id: true },
    });

    if (allCards.length > 0) {
      const jobData = allCards.map((card) => ({
        cardId: card.id,
        status: 'pending',
      }));

      await this.prisma.ratingJob.createMany({
        data: jobData,
        skipDuplicates: true, // Don't enqueue if already pending? Actually, let's just enqueue.
      });

      this.logger.log(
        `Enqueued ${allCards.length} recalculation jobs for config ${config.version}`,
      );
    }

    return {
      activated: config.version,
      enqueuedJobs: allCards.length,
    };
  }
}
