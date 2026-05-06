import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MatchmakingService } from '../matchmaking.service';

@Injectable()
export class MatchmakingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchmakingWorker.name);
  private intervalId: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // 5 seconds

  constructor(private readonly matchmakingService: MatchmakingService) {}

  onModuleInit() {
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  start(): void {
    if (this.intervalId) {
      return;
    }

    this.logger.log('Matchmaking worker started');
    this.intervalId = setInterval(async () => {
      try {
        const result = await this.matchmakingService.processQueue();
        if (result.matches > 0) {
          this.logger.log(`Processed ${result.processed} entries, created ${result.matches} matches`);
        }
      } catch (error) {
        // Log specific error types for better debugging
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.logger.error('Redis connection error - matchmaking temporarily paused', error.message);
        } else if (error.name === 'PrismaClientKnownRequestError') {
          this.logger.error('Database error in matchmaking worker', error.message);
        } else {
          this.logger.error('Unexpected error in matchmaking worker', error);
        }
        // Worker continues running despite errors - implements graceful degradation
      }
    }, this.POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Matchmaking worker stopped');
    }
  }
}
