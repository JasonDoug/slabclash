import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import seedrandom from 'seedrandom';
import { ResolveMatchDto } from './dto/resolve-match.dto';
import { ResolutionResult } from './interfaces/resolution-result.interface';
import { PerPositionResult } from './interfaces/per-position-result.interface';
import { MatchEvent } from './interfaces/match-event.interface';
import type { RealtimeService } from '../realtime/realtime.interface';

interface LineupInput {
  id?: string;
  userId?: string;
  slots: Record<string, string>;
  aggregateMomentum?: number;
  cards?: Array<{ id: string; playerStats: number | null; marketValueCents: number | null }>;
}

@Injectable()
export class MatchEngineService {
  private readonly logger = new Logger(MatchEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RealtimeService') private readonly realtimeService: RealtimeService,
  ) {}

  async resolveMatch(dto: ResolveMatchDto, requestUserId?: string): Promise<ResolutionResult> {
    let lineupAInput: LineupInput;
    let lineupBInput: LineupInput;
    let matchSeed: string;
    let matchId: string | undefined;
    let match: any = null;

    if (dto.matchId) {
      matchId = dto.matchId;
      match = await this.prisma.match.findUnique({
        where: { id: dto.matchId },
        include: {
          lineupA: true,
          lineupB: true,
        },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      // Ownership check: ensure requestUserId matches one of the lineup owners
      if (requestUserId) {
        const ownerA = match.lineupA.userId;
        const ownerB = match.lineupB.userId;
        if (requestUserId !== ownerA && requestUserId !== ownerB) {
          throw new ForbiddenException('You do not have permission to resolve this match');
        }
      }

      if (match.resolutionResults) {
        this.logger.log(`Match ${matchId} already resolved, returning stored results`);
        const stored = match.resolutionResults as any;
        // Normalize resolvedAt from ISO string to Date
        if (typeof stored.resolvedAt === 'string') {
          stored.resolvedAt = new Date(stored.resolvedAt);
        }
        return stored as ResolutionResult;
      }

      matchSeed = match.matchSeed;
      lineupAInput = this.prismaLineupToInput(match.lineupA);
      lineupBInput = this.prismaLineupToInput(match.lineupB);
    } else if (dto.lineupA && dto.lineupB && dto.matchSeed) {
      matchSeed = dto.matchSeed;
      lineupAInput = { slots: dto.lineupA.slots, aggregateMomentum: dto.lineupA.aggregateMomentum };
      lineupBInput = { slots: dto.lineupB.slots, aggregateMomentum: dto.lineupB.aggregateMomentum };
    } else {
      throw new BadRequestException('Invalid input: provide matchId or lineupA + lineupB + matchSeed');
    }

    // Validate both lineups have same position keys
    const positionsA = Object.keys(lineupAInput.slots);
    const positionsB = Object.keys(lineupBInput.slots);
    if (positionsA.length !== positionsB.length || !positionsA.every(p => positionsB.includes(p))) {
      throw new BadRequestException('Lineups must have identical position keys');
    }

    // Fetch all cards for both lineups
    const allCardIds = [
      ...Object.values(lineupAInput.slots),
      ...Object.values(lineupBInput.slots),
    ];
    const cards = await this.prisma.card.findMany({
      where: { id: { in: allCardIds } },
    });

    lineupAInput.cards = positionsA.map(pos => {
      const cardId = lineupAInput.slots[pos];
      return cards.find(c => c.id === cardId) || { id: cardId, playerStats: null, marketValueCents: null };
    });
    lineupBInput.cards = positionsB.map(pos => {
      const cardId = lineupBInput.slots[pos];
      return cards.find(c => c.id === cardId) || { id: cardId, playerStats: null, marketValueCents: null };
    });

    // Create seeded RNG
    const rng = seedrandom(matchSeed);

    // Process each position
    const perPositionResults: PerPositionResult[] = [];
    const events: MatchEvent[] = [];
    let scoreA = 0;
    let scoreB = 0;

    for (const position of positionsA) {
      const cardA = lineupAInput.cards[positionsA.indexOf(position)];
      const cardB = lineupBInput.cards[positionsB.indexOf(position)];

      const statA = this.computePositionStat(cardA, position);
      const statB = this.computePositionStat(cardB, position);

      const comparison = this.comparePositions(statA, statB);
      scoreA += comparison.pointsA;
      scoreB += comparison.pointsB;

      perPositionResults.push({
        position,
        cardAId: cardA.id,
        cardBId: cardB.id,
        statA,
        statB,
        winner: comparison.winner,
        pointsA: comparison.pointsA,
        pointsB: comparison.pointsB,
      });

      events.push({
        type: 'position_comparison',
        description: `Position ${position}: ${comparison.winner === 'draw' ? 'draw' : 'Lineup ' + comparison.winner + ' wins'} (${statA.toFixed(2)} vs ${statB.toFixed(2)})`,
        position,
      });
    }

    // Determine winner
    let winner: 'A' | 'B' | 'draw' = 'draw';
    if (scoreA > scoreB) winner = 'A';
    else if (scoreB > scoreA) winner = 'B';
    else {
      winner = this.applyTiebreakers(lineupAInput, lineupBInput, rng, events);
    }

    const result: ResolutionResult = {
      winner,
      winnerLineupId: matchId
        ? winner === 'A'
          ? lineupAInput.id
          : winner === 'B'
            ? lineupBInput.id
            : undefined
        : undefined,
      lineupAId: lineupAInput.id || 'N/A',
      lineupBId: lineupBInput.id || 'N/A',
      scoreA,
      scoreB,
      perPositionResults,
      events,
      matchSeed,
      resolvedAt: new Date(),
    };

    // Persist results if using matchId
    if (matchId) {
      await this.prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'completed',
          winnerLineupId: winner === 'A' ? lineupAInput.id : winner === 'B' ? lineupBInput.id : undefined,
          completedAt: new Date(),
          resolutionResults: result as unknown as Prisma.InputJsonValue,
        },
      });

      // Notify users of the result
      if (lineupAInput.userId && lineupBInput.userId) {
        try {
          await Promise.all([
            this.realtimeService.publishToUser(lineupAInput.userId, 'match.result', result),
            this.realtimeService.publishToUser(lineupBInput.userId, 'match.result', result),
          ]);
        } catch (err) {
          this.logger.error(
            `Failed to publish match.result for match ${matchId} to users ${lineupAInput.userId}, ${lineupBInput.userId}`,
            err.stack,
          );
        }
      }
    }

    return result;
  }

  private computePositionStat(
    card: { id: string; playerStats: number | null; marketValueCents: number | null },
    position: string,
  ): number {
    void position; // MVP: no position-specific weights
    return card.playerStats || 0;
  }

  private comparePositions(statA: number, statB: number): {
    winner: 'A' | 'B' | 'draw';
    pointsA: number;
    pointsB: number;
  } {
    if (statA > statB) return { winner: 'A', pointsA: 1, pointsB: 0 };
    if (statB > statA) return { winner: 'B', pointsA: 0, pointsB: 1 };
    return { winner: 'draw', pointsA: 0.5, pointsB: 0.5 };
  }

  private applyTiebreakers(
    lineupA: LineupInput,
    lineupB: LineupInput,
    rng: () => number,
    events: MatchEvent[],
  ): 'A' | 'B' | 'draw' {
    // Tiebreaker 1: aggregateMarketValue
    const marketValueA = lineupA.cards?.reduce((sum, c) => sum + (c.marketValueCents || 0), 0) || 0;
    const marketValueB = lineupB.cards?.reduce((sum, c) => sum + (c.marketValueCents || 0), 0) || 0;

    if (marketValueA > marketValueB) {
      events.push({
        type: 'tiebreaker_market_value',
        description: `Tiebreaker: Lineup A wins by market value (${marketValueA} vs ${marketValueB})`,
      });
      return 'A';
    }
    if (marketValueB > marketValueA) {
      events.push({
        type: 'tiebreaker_market_value',
        description: `Tiebreaker: Lineup B wins by market value (${marketValueB} vs ${marketValueA})`,
      });
      return 'B';
    }

    // Tiebreaker 2: aggregateMomentum (from LineupInput, not any cast)
    const momentumA = lineupA.aggregateMomentum || 0;
    const momentumB = lineupB.aggregateMomentum || 0;

    if (momentumA > momentumB) {
      events.push({
        type: 'tiebreaker_momentum',
        description: `Tiebreaker: Lineup A wins by momentum (${momentumA} vs ${momentumB})`,
      });
      return 'A';
    }
    if (momentumB > momentumA) {
      events.push({
        type: 'tiebreaker_momentum',
        description: `Tiebreaker: Lineup B wins by momentum (${momentumB} vs ${momentumA})`,
      });
      return 'B';
    }

    // Tiebreaker 3: sudden death
    const suddenDeathResult = rng() < 0.5 ? 'A' : 'B';
    events.push({
      type: 'tiebreaker_sudden_death',
      description: `Tiebreaker: Sudden death - Lineup ${suddenDeathResult} wins (seed-based RNG)`,
    });
    return suddenDeathResult as 'A' | 'B';
  }

  private prismaLineupToInput(lineup: { id: string; slots: any; userId?: string; aggregateMomentum?: number }): LineupInput {
    return {
      id: lineup.id,
      userId: lineup.userId,
      slots: lineup.slots as Record<string, string>,
      aggregateMomentum: lineup.aggregateMomentum || 0,
    };
  }
}
