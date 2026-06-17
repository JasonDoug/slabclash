export interface MatchEvent {
  type:
    | 'position_comparison'
    | 'tiebreaker_market_value'
    | 'tiebreaker_momentum'
    | 'tiebreaker_sudden_death'
    | 'war_transfer';
  description: string;
  position?: string;
}
