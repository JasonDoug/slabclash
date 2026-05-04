import { Module } from '@nestjs/common';
import { MatchEngineService } from './match-engine.service';
import { MatchEngineController } from './match-engine.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MatchEngineService],
  controllers: [MatchEngineController],
  exports: [MatchEngineService],
})
export class MatchEngineModule {}
