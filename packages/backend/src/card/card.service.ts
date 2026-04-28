import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConditionReported, Rarity, Prisma, IngestionStatus } from '@prisma/client';

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  async createCard(data: {
    userId: string;
    playerId: string;
    year: number;
    setName: string;
    variant?: string;
    conditionReported: ConditionReported;
    rarity: Rarity;
    provenance: Prisma.InputJsonValue;
    imageFrontKey: string;
    imageBackKey?: string | null;
    phash?: string | null;
    ingestionStatus: IngestionStatus;
  }) {
    return this.prisma.card.create({
      data: {
        userId: data.userId,
        playerId: data.playerId,
        year: data.year,
        setName: data.setName,
        variant: data.variant,
        conditionReported: data.conditionReported,
        rarity: data.rarity,
        provenance: data.provenance,
        imageFrontKey: data.imageFrontKey,
        imageBackKey: data.imageBackKey,
        phash: data.phash,
        ingestionStatus: data.ingestionStatus,
      },
    });
  }

  async getCard(userId: string, cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        player: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this card',
      );
    }

    return card;
  }
}
