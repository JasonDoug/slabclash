export interface MatchEvent {
  type: 'position_comparison' | 'tiebreaker_market_value' | 'tiebreaker_momentum' | 'tiebreaker_sudden_death';
  description: string;
  position?: string;
}
