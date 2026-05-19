import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingService } from './rating.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RatingRecalculationWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RatingRecalculationWorker.name);
  private intervalId: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 10000; // 10 seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingService: RatingService,
  ) {}

  onModuleInit() {
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.intervalId) return;
    this.logger.log('Rating recalculation worker started');
    this.intervalId = setInterval(
      () => this.processJobs(),
      this.POLL_INTERVAL_MS,
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Rating recalculation worker stopped');
    }
  }

  async processJobs() {
    const jobs = await this.prisma.ratingJob.findMany({
      where: { status: 'pending' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    if (jobs.length === 0) return;

    this.logger.log(`Processing ${jobs.length} rating recalculation jobs`);

    for (const job of jobs) {
      try {
        await this.processJob(job.id, job.cardId);
      } catch (err) {
        this.logger.error(
          `Failed to process rating job ${job.id} for card ${job.cardId}`,
          err.stack,
        );
        await this.prisma.ratingJob.update({
          where: { id: job.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  private async processJob(jobId: string, cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new Error(`Card ${cardId} not found`);
    }

    const ratingDto = {
      card: {
        id: card.id,
        playerStats: card.playerStats ?? 50,
        marketValueCents: card.marketValueCents ?? undefined,
        rarity: card.rarity,
        conditionEstimatedScore: card.conditionEstimatedScore ?? undefined,
        momentum: 0,
      },
    };

    const ratingResult = await this.ratingService.calculate(ratingDto);

    const oldPowerScore = card.powerScore;
    const oldVersion = card.ratingConfigVersion;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Card
      await tx.card.update({
        where: { id: cardId },
        data: {
          powerScore: ratingResult.powerScore,
          ratingConfigVersion: ratingResult.ratingConfigVersion,
        },
      });

      // 2. Write AuditLog (only if changed, for idempotency)
      if (
        oldPowerScore !== ratingResult.powerScore ||
        oldVersion !== ratingResult.ratingConfigVersion
      ) {
        await tx.auditLog.create({
          data: {
            entityType: 'Card',
            entityId: cardId,
            action: 'recalculate_score',
            oldValue: {
              powerScore: oldPowerScore,
              version: oldVersion,
            },
            newValue: {
              powerScore: ratingResult.powerScore,
              version: ratingResult.ratingConfigVersion,
            },
          },
        });
      }

      // 3. Update Job status
      await tx.ratingJob.update({
        where: { id: jobId },
        data: { status: 'completed' },
      });
    });

    this.logger.log(
      `Successfully recalculated score for card ${cardId} (Score: ${ratingResult.powerScore})`,
    );
  }
}
