import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/disputes')
export class AdminDisputeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDisputes(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    const skip = (p - 1) * l;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          card: { include: { player: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: p,
        limit: l,
        pages: Math.ceil(total / l),
      },
    };
  }

  @Post(':id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body('resolution') status: 'resolved' | 'rejected',
  ) {
    if (!['resolved', 'rejected'].includes(status)) {
      throw new BadRequestException('Invalid resolution status');
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { card: true },
    });

    if (!dispute) {
      throw new BadRequestException('Dispute not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update dispute status
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: { status },
      });

      // If resolved, we might want to un-flag the card?
      // Logic depends on business rules. Let's say resolving a dispute un-flags the card.
      if (status === 'resolved') {
        await tx.card.update({
          where: { id: dispute.cardId },
          data: { ingestionStatus: 'verified' },
        });
      }

      return updatedDispute;
    });
  }
}
