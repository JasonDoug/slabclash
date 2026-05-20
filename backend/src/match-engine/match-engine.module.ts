import { Module } from '@nestjs/common';
import { MatchEngineService } from './match-engine.service';
import { MatchEngineController } from './match-engine.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [MatchEngineService],
  controllers: [MatchEngineController],
  exports: [MatchEngineService],
})
export class MatchEngineModule {}
