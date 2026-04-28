import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(private prisma: PrismaService) {}

  async scheduleRating(cardId: string) {
    const job = await this.prisma.ratingJob.create({
      data: {
        cardId,
        status: 'pending',
      },
    });
    this.logger.log(`Scheduled rating job ${job.id} for card ${cardId}`);
    return job;
  }

  calculatePowerScore(cardId: string): number | null {
    // Stub implementation - returns null until rating engine is implemented
    this.logger.warn(`Rating engine not yet implemented for card ${cardId}`);
    return null;
  }
}
