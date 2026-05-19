import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RatingRecalculationWorker } from './rating-recalculation.worker';

@Module({
  imports: [PrismaModule],
  controllers: [RatingController],
  providers: [RatingService, RatingRecalculationWorker],
  exports: [RatingService],
})
export class RatingModule {}
