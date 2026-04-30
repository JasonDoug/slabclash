import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RatingModule } from './rating/rating.module';
import { CardModule } from './card/card.module';
import { LineupModule } from './lineup/lineup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    IngestionModule,
    RatingModule,
    CardModule,
    LineupModule,
  ],
})
export class AppModule {}
