import { Module } from '@nestjs/common';
import { AdminIngestionController } from './admin-ingestion.controller';
import { AdminRatingController } from './admin-rating.controller';
import { AdminDisputeController } from './admin-dispute.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminIngestionController,
    AdminRatingController,
    AdminDisputeController,
  ],
})
export class AdminModule {}
