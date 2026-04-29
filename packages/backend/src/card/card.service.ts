import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingService } from '../rating/rating.service';
import { S3Service } from '../storage/s3.service';
import {
  ConditionReported,
  Rarity,
  Prisma,
  IngestionStatus,
} from '@prisma/client';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private prisma: PrismaService,
    private ratingService: RatingService,
    private s3Service: S3Service,
  ) {}

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
    playerStats?: number;
    marketValueCents?: number;
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
        playerStats: data.playerStats,
        marketValueCents: data.marketValueCents,
      },
    });
  }

  async listCards(
    userId: string,
    requestingUserId: string,
    filters: {
      page?: number;
      limit?: number;
      rarity?: Rarity;
      setName?: string;
      year?: number;
      playerId?: string;
    } = {},
  ) {
    if (userId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own cards');
    }

    const { page = 1, limit = 20, rarity, setName, year, playerId } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CardWhereInput = { userId };
    if (rarity) where.rarity = rarity;
    if (setName) where.setName = { contains: setName, mode: 'insensitive' };
    if (year) where.year = year;
    if (playerId) where.playerId = playerId;

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        include: {
          player: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.card.count({ where }),
    ]);

    return {
      data: cards,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async getCardWithBreakdown(userId: string, cardId: string) {
    const card = await this.getCard(userId, cardId);

    // Generate signed URLs for images
    const imageFrontUrl = card.imageFrontKey
      ? await this.s3Service.getPresignedDownloadUrl(card.imageFrontKey)
      : null;
    const imageBackUrl = card.imageBackKey
      ? await this.s3Service.getPresignedDownloadUrl(card.imageBackKey)
      : null;

    // Compute rating breakdown if card has necessary data
    let powerBreakdown = null;
    if (card.playerStats !== null && card.ratingConfigVersion) {
      try {
        const ratingDto = {
          card: {
            id: card.id,
            playerStats: card.playerStats as number,
            marketValueCents: card.marketValueCents ?? undefined,
            rarity: card.rarity,
            conditionEstimatedScore: card.conditionEstimatedScore ?? undefined,
            momentum: 0,
          },
          ratingConfigVersion: card.ratingConfigVersion,
        };
        const ratingResult = await this.ratingService.calculate(ratingDto);
        powerBreakdown = ratingResult.breakdown;
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Failed to calculate breakdown for card ${cardId}: ${error.message}`,
          error.stack,
        );
      }
    }

    return {
      ...card,
      imageFrontUrl,
      imageBackUrl,
      powerBreakdown,
    };
  }


  async updateCardMetadata(
    userId: string,
    cardId: string,
    data: {
      setName?: string;
      variant?: string;
      conditionReported?: ConditionReported;
    },
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You can only edit your own cards');
    }

    const updateData: Prisma.CardUpdateInput = {};
    if (data.setName !== undefined) updateData.setName = data.setName;
    if (data.variant !== undefined) updateData.variant = data.variant;
    if (data.conditionReported !== undefined) {
      updateData.conditionReported = data.conditionReported;
    }

    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: updateData,
    });

    // If conditionReported changed, re-enqueue rating job
    if (data.conditionReported !== undefined) {
      await this.ratingService.scheduleRating(cardId);
    }

    return updatedCard;
  }
}
