import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RatingModule } from './rating/rating.module';
import { CardModule } from './card/card.module';
import { LineupModule } from './lineup/lineup.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { MatchmakingWorker } from './matchmaking/worker/matchmaking.worker';
import { MatchEngineModule } from './match-engine/match-engine.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    IngestionModule,
    RatingModule,
    CardModule,
    LineupModule,
    MatchmakingModule,
    MatchEngineModule,
    RealtimeModule,
    AdminModule,
  ],
  providers: [MatchmakingWorker],
})
export class AppModule {}
