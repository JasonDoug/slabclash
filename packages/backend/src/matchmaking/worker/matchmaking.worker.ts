import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MatchmakingService } from '../matchmaking.service';

@Injectable()
export class MatchmakingWorker implements OnModuleInit {
  private readonly logger = new Logger(MatchmakingWorker.name);
  private intervalId: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // 5 seconds

  constructor(private readonly matchmakingService: MatchmakingService) {}

  onModuleInit() {
    this.start();
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
        this.logger.error('Error in matchmaking worker', error);
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
