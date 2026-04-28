import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { CVService } from './cv/cv.service';
import { MockCVAdapter } from './cv/mock-cv.adapter';
import { GoogleVisionAdapter } from './cv/google-vision.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MatchCandidateService } from './match-candidate.service';
import { CardModule } from '../card/card.module';
import { RatingModule } from '../rating/rating.module';

@Module({
  imports: [PrismaModule, StorageModule, ConfigModule, CardModule, RatingModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    MatchCandidateService,
    {
      provide: CVService,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('CV_PROVIDER') || 'mock';
        return provider === 'google'
          ? new GoogleVisionAdapter(configService)
          : new MockCVAdapter();
      },
      inject: [ConfigService],
    },
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
