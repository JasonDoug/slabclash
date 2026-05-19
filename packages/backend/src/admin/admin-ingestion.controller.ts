import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AdminIngestionQueryDto } from './dto/admin-ingestion-query.dto';
import { IngestionStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('v1/admin/ingestion')
export class AdminIngestionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('queue')
  async getQueue(@Query() query: AdminIngestionQueryDto) {
    const { page = 1, limit = 20, status, userId } = query;
    const skip = (page - 1) * limit;

    const where = {
      status: status || { not: IngestionStatus.verified },
      ...(userId && { userId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.cardIngestionJob.findMany({
        where,
        include: { user: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cardIngestionJob.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Post(':jobId/approve')
  async approve(@Param('jobId') jobId: string) {
    const job = await this.prisma.cardIngestionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return this.prisma.cardIngestionJob.update({
      where: { id: jobId },
      data: { status: IngestionStatus.verified },
    });
  }

  @Post(':jobId/reject')
  async reject(@Param('jobId') jobId: string, @Body('reason') reason: string) {
    const job = await this.prisma.cardIngestionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return this.prisma.cardIngestionJob.update({
      where: { id: jobId },
      data: { 
        status: IngestionStatus.flagged,
        // We could add a notes field if we updated the schema, but for now we'll just flag it
      },
    });
  }
}
