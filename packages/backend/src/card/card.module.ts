import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { UserCardsController } from './user-cards.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RatingModule } from '../rating/rating.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, RatingModule, StorageModule],
  providers: [CardService],
  controllers: [CardController, UserCardsController],
  exports: [CardService],
})
export class CardModule {}
