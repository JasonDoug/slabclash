import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface Slots {
  [position: string]: string;
}

interface RarityCounts {
  [rarity: string]: number;
}

@Injectable()
export class LineupService {
  constructor(private readonly prisma: PrismaService) {}

  async createLineup(userId: string, name: string, slots: Slots) {
    const cardIds = Object.values(slots);

    // Check for duplicate card IDs in slots
    const uniqueCardIds = [...new Set(cardIds)];
    if (uniqueCardIds.length !== cardIds.length) {
      throw new BadRequestException(
        'Duplicate cards are not allowed in lineup slots',
      );
    }

    const cards = await this.prisma.card.findMany({
      where: {
        id: { in: cardIds },
        userId: userId,
      },
    });

    if (cards.length !== cardIds.length) {
      throw new BadRequestException('Some cards do not belong to the user');
    }

    const aggregatePowerScore = cards.reduce(
      (sum, card) => sum + (card.powerScore || 0),
      0,
    );

    const rarityCounts = cards.reduce((acc, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      return acc;
    }, {} as RarityCounts);

    return this.prisma.lineup.create({
      data: {
        userId,
        name,
        slots: slots,
        aggregatePowerScore,
        rarityCounts: rarityCounts,
      },
    });
  }

  async getLineup(lineupId: string, userId: string) {
    const lineup = await this.prisma.lineup.findFirst({
      where: { id: lineupId, userId },
    });

    if (!lineup) {
      throw new NotFoundException('Lineup not found');
    }

    return lineup;
  }

  async getUserLineups(userId: string) {
    return this.prisma.lineup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteLineup(lineupId: string, userId: string) {
    const lineup = await this.prisma.lineup.findFirst({
      where: { id: lineupId, userId },
    });

    if (!lineup) {
      throw new NotFoundException('Lineup not found');
    }

    // Check for existing matches referencing this lineup
    const existingMatch = await this.prisma.match.findFirst({
      where: {
        OR: [{ lineupAId: lineupId }, { lineupBId: lineupId }],
      },
    });

    if (existingMatch) {
      throw new BadRequestException(
        'Cannot delete lineup that is part of an existing match',
      );
    }

    try {
      return await this.prisma.lineup.delete({
        where: { id: lineupId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete lineup that is part of an existing match',
        );
      }
      throw error;
    }
  }
}
