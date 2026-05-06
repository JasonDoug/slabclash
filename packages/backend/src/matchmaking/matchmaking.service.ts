import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import crypto from 'crypto';
import { MatchType } from './dto/enqueue-matchmaking.dto';
import type { RealtimeService } from '../realtime/realtime.interface';
import { MatchEngineService } from '../match-engine/match-engine.service';
import { ResolveMatchDto } from '../match-engine/dto/resolve-match.dto';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly BIN_SIZE = 50;
  private readonly CASUAL_TOLERANCE = 0.05; // 5%
  private readonly RANKED_TOLERANCE = 0.02; // 2%
  private readonly QUEUE_TTL_SECONDS = 1800; // 30 minutes

  // Lua script for atomic match creation
  private readonly ATOMIC_MATCH_SCRIPT = `
    local queueKey = KEYS[1]
    local entry1Key = KEYS[2]
    local entry2Key = KEYS[3]
    local entry1 = ARGV[1]
    local entry2 = ARGV[2]
    
    -- Check if both entries still exist in queue
    local rank1 = redis.call('ZRANK', queueKey, entry1)
    local rank2 = redis.call('ZRANK', queueKey, entry2)
    
    if rank1 == false or rank2 == false then
      return nil
    end
    
    -- Atomically remove both from queue and their entry keys
    redis.call('ZREM', queueKey, entry1)
    redis.call('ZREM', queueKey, entry2)
    redis.call('DEL', entry1Key)
    redis.call('DEL', entry2Key)
    
    return 1
  `;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('RealtimeService') private readonly realtimeService: RealtimeService,
    private readonly matchEngineService: MatchEngineService,
  ) {}

  private generateMatchSeed(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  getPowerBin(aggregatePowerScore: number): number {
    return Math.floor(aggregatePowerScore / this.BIN_SIZE);
  }

  getQueueKey(matchType: MatchType, powerBin: number): string {
    return `matchmaking:${matchType}:bin:${powerBin}`;
  }

  getQueueEntryKey(userId: string): string {
    return `matchmaking:entry:${userId}`;
  }

  getActiveBinsKey(matchType: MatchType): string {
    return `matchmaking:${matchType}:active_bins`;
  }

  getTolerance(matchType: MatchType): number {
    return matchType === MatchType.casual ? this.CASUAL_TOLERANCE : this.RANKED_TOLERANCE;
  }

  async enqueue(userId: string, lineupId: string, matchType: MatchType): Promise<{ queued: boolean; queuePosition: number }> {
    const lineup = await this.prisma.lineup.findFirst({
      where: { id: lineupId, userId },
    });

    if (!lineup) {
      throw new NotFoundException('Lineup not found or does not belong to user');
    }

    if (lineup.aggregatePowerScore === 0) {
      throw new BadRequestException('Lineup has no power score');
    }

    const existingEntry = await this.redis.get(this.getQueueEntryKey(userId));
    if (existingEntry) {
      throw new BadRequestException('User already in matchmaking queue');
    }

    const powerBin = this.getPowerBin(lineup.aggregatePowerScore);
    const queueKey = this.getQueueKey(matchType, powerBin);
    const timestamp = Date.now();

    await this.redis.zadd(queueKey, timestamp, `${userId}:${lineupId}`);

    await this.redis.setex(
      this.getQueueEntryKey(userId),
      this.QUEUE_TTL_SECONDS,
      JSON.stringify({
        lineupId,
        matchType,
        powerBin,
        timestamp,
      }),
    );

    // Track active bin for optimized queue processing
    await this.redis.sadd(this.getActiveBinsKey(matchType), powerBin.toString());

    const rank = await this.redis.zrank(queueKey, `${userId}:${lineupId}`);
    const queuePosition = rank !== null ? rank + 1 : 1;

    this.logger.log(`User ${userId} enqueued for ${matchType} match with power bin ${powerBin}`);

    return { queued: true, queuePosition };
  }

  async getStatus(userId: string): Promise<{
    inQueue: boolean;
    matchType?: MatchType;
    queuePosition?: number;
    powerBin?: number;
    enqueuedAt?: number;
  }> {
    const entryData = await this.redis.get(this.getQueueEntryKey(userId));

    if (!entryData) {
      return { inQueue: false };
    }

    const entry = JSON.parse(entryData);
    const queueKey = this.getQueueKey(entry.matchType as MatchType, entry.powerBin);
    const rank = await this.redis.zrank(queueKey, `${userId}:${entry.lineupId}`);

    return {
      inQueue: true,
      matchType: entry.matchType,
      queuePosition: rank !== null ? rank + 1 : undefined,
      powerBin: entry.powerBin,
      enqueuedAt: entry.timestamp,
    };
  }

  async removeFromQueue(userId: string): Promise<boolean> {
    const entryData = await this.redis.get(this.getQueueEntryKey(userId));
    if (!entryData) {
      return false;
    }

    const entry = JSON.parse(entryData);
    const queueKey = this.getQueueKey(entry.matchType as MatchType, entry.powerBin);

    await this.redis.zrem(queueKey, `${userId}:${entry.lineupId}`);
    await this.redis.del(this.getQueueEntryKey(userId));

    return true;
  }

  async findMatch(userId: string): Promise<{ matched: boolean; matchId?: string }> {
    const entryData = await this.redis.get(this.getQueueEntryKey(userId));
    if (!entryData) {
      return { matched: false };
    }

    const entry = JSON.parse(entryData);
    const binsToCheck = [entry.powerBin - 1, entry.powerBin, entry.powerBin + 1];

    for (const bin of binsToCheck) {
      if (bin < 0) continue;

      const queueKey = this.getQueueKey(entry.matchType as MatchType, bin);
      const members = await this.redis.zrange(queueKey, 0, 0);

      if (members.length > 0) {
        const [otherUserId, otherLineupId] = members[0].split(':');

        if (otherUserId === userId) {
          const nextMembers = await this.redis.zrange(queueKey, 1, 1);
          if (nextMembers.length === 0) continue;
          const [nextUserId, nextLineupId] = nextMembers[0].split(':');
          return this.createMatch(userId, entry.lineupId, nextUserId, nextLineupId, entry.matchType, queueKey, nextMembers[0]);
        }

        return this.createMatch(userId, entry.lineupId, otherUserId, otherLineupId, entry.matchType, queueKey, members[0]);
      }
    }

    return { matched: false };
  }

  private async createMatch(
    userAId: string,
    lineupAId: string,
    userBId: string,
    lineupBId: string,
    matchType: string,
    queueKey: string,
    entryToRemove: string,
  ): Promise<{ matched: boolean; matchId?: string }> {
    await this.redis.zrem(queueKey, entryToRemove);

    await this.redis.del(this.getQueueEntryKey(userAId));
    await this.redis.del(this.getQueueEntryKey(userBId));

    const matchSeed = this.generateMatchSeed();

    const match = await this.prisma.match.create({
      data: {
        lineupAId,
        lineupBId,
        matchType: matchType as MatchType,
        matchSeed,
        status: 'pending',
      },
    });

    this.logger.log(`Match created: ${match.id} between ${userAId} and ${userBId}`);
    await this.notifyMatchFound(lineupAId, lineupBId, match.id, matchType);

    // Auto-resolve match for MVP (after a 2-second delay to allow mobile to show countdown)
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(async () => {
        try {
          const dto = new ResolveMatchDto();
          dto.matchId = match.id;
          await this.matchEngineService.resolveMatch(dto);
          this.logger.log(`Auto-resolved match ${match.id}`);
        } catch (err) {
          this.logger.error(`Failed to auto-resolve match ${match.id}`, err);
        }
      }, 2000);
    }

    return { matched: true, matchId: match.id };
  }

  private async notifyMatchFound(lineupAId: string, lineupBId: string, matchId: string, matchType: string): Promise<void> {
    this.logger.log(`Match found! Match ID: ${matchId}, Lineups: ${lineupAId}, ${lineupBId}`);

    // Fetch lineup info for payload
    const [lineupA, lineupB] = await Promise.all([
      this.prisma.lineup.findUnique({ where: { id: lineupAId }, include: { user: true } }),
      this.prisma.lineup.findUnique({ where: { id: lineupBId }, include: { user: true } }),
    ]);

    if (!lineupA?.user || !lineupB?.user) {
      this.logger.warn(`Lineup or user not found for match ${matchId}`);
      return;
    }

    const payload = {
      matchId,
      matchType,
      opponentA: { userId: lineupA.user.id, username: lineupA.user.username },
      opponentB: { userId: lineupB.user.id, username: lineupB.user.username },
      lineupPowerA: lineupA.aggregatePowerScore || 0,
      lineupPowerB: lineupB.aggregatePowerScore || 0,
    };

    await Promise.all([
      this.realtimeService.publishToUser(lineupA.user.id, 'match:found', { ...payload, opponent: payload.opponentB }),
      this.realtimeService.publishToUser(lineupB.user.id, 'match:found', { ...payload, opponent: payload.opponentA }),
    ]);
  }

  async processQueue(): Promise<{ processed: number; matches: number }> {
    let processed = 0;
    let matches = 0;

    const matchTypes = [MatchType.casual, MatchType.ranked];

    for (const matchType of matchTypes) {
      // Get active bins to avoid scanning empty ones
      const activeBinsKey = this.getActiveBinsKey(matchType);
      const activeBins = await this.redis.smembers(activeBinsKey);

      for (const binStr of activeBins) {
        const bin = parseInt(binStr, 10);
        const queueKey = this.getQueueKey(matchType, bin);
        const count = await this.redis.zcard(queueKey);

        if (count >= 2) {
          processed += count;
          const result = await this.findMatchFromBin(queueKey, matchType, bin);
          if (result.matched) {
            matches++;
          }
        } else if (count === 0) {
          // Remove empty bin from active set
          await this.redis.srem(activeBinsKey, binStr);
        }
      }
    }

    return { processed, matches };
  }

  private async findMatchFromBin(
    queueKey: string,
    matchType: MatchType,
    bin: number,
  ): Promise<{ matched: boolean; matchId?: string }> {
    const members = await this.redis.zrange(queueKey, 0, 1);

    if (members.length < 2) {
      return { matched: false };
    }

    const [entry1, entry2] = members;
    const [userAId, lineupAId] = entry1.split(':');
    const [userBId, lineupBId] = entry2.split(':');

    // Use Lua script for atomic removal from queue
    const removed = await this.redis.eval(
      this.ATOMIC_MATCH_SCRIPT,
      3,
      queueKey,
      this.getQueueEntryKey(userAId),
      this.getQueueEntryKey(userBId),
      entry1,
      entry2,
    );

    // If atomic removal failed, another worker already matched these users
    if (!removed) {
      this.logger.warn(`Race condition avoided for ${userAId} and ${userBId}`);
      return { matched: false };
    }

    // Validate that both lineups still exist before creating match
    const [lineupA, lineupB] = await Promise.all([
      this.prisma.lineup.findUnique({ where: { id: lineupAId } }),
      this.prisma.lineup.findUnique({ where: { id: lineupBId } }),
    ]);

    if (!lineupA || !lineupB) {
      this.logger.warn(`Lineup validation failed for ${lineupAId} or ${lineupBId}`);
      return { matched: false };
    }

    const matchSeed = this.generateMatchSeed();

    const match = await this.prisma.match.create({
      data: {
        lineupAId,
        lineupBId,
        matchType,
        matchSeed,
        status: 'pending',
      },
    });

    this.logger.log(`Match created from worker: ${match.id}`);
    await this.notifyMatchFound(lineupAId, lineupBId, match.id, matchType);

    // Auto-resolve match for MVP (after a 2-second delay to allow mobile to show countdown)
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(async () => {
        try {
          const dto = new ResolveMatchDto();
          dto.matchId = match.id;
          await this.matchEngineService.resolveMatch(dto);
          this.logger.log(`Auto-resolved match ${match.id} (worker)`);
        } catch (err) {
          this.logger.error(`Failed to auto-resolve match ${match.id} (worker)`, err);
        }
      }, 2000);
    }

    return { matched: true, matchId: match.id };
  }
}
