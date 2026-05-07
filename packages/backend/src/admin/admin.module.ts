import { Module } from '@nestjs/common';
import { AdminIngestionController } from './admin-ingestion.controller';
import { AdminRatingController } from './admin-rating.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminIngestionController, AdminRatingController],
})
export class AdminModule {}
