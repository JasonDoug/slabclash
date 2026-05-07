import { PerPositionResult } from './per-position-result.interface';
import { MatchEvent } from './match-event.interface';

export interface ResolutionResult {
  winner: 'A' | 'B' | 'draw';
  winnerLineupId?: string;
  lineupAId: string;
  lineupBId: string;
  scoreA: number;
  scoreB: number;
  perPositionResults: PerPositionResult[];
  events: MatchEvent[];
  matchSeed: string;
  resolvedAt: Date;
}
