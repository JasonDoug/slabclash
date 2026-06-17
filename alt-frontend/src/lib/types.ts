export type Sport = 'baseball' | 'football' | 'basketball' | 'hockey';

export interface CardStats {
  power: number;
  speed: number;
  defense: number;
  skill: number;
  clutch: number;
}

export interface PlayerCard {
  id: string;
  playerName: string;
  team: string;
  sport: Sport;
  year: number;
  position: string;
  imageUrl?: string;
  stats: CardStats;
  overallRating: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'iconic';
  estimatedValue: number;
  createdAt: Date;
}

export interface BattleResult {
  id: string;
  playerCard: PlayerCard;
  opponentCard: PlayerCard;
  playerScore: number;
  opponentScore: number;
  won: boolean;
  timestamp: Date;
}

export const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  baseball: { label: 'Baseball', icon: '⚾', color: 'hsl(0, 72%, 51%)' },
  football: { label: 'Football', icon: '🏈', color: 'hsl(25, 90%, 48%)' },
  basketball: { label: 'Basketball', icon: '🏀', color: 'hsl(30, 90%, 50%)' },
  hockey: { label: 'Hockey', icon: '🏒', color: 'hsl(200, 80%, 50%)' },
};

export const RARITY_CONFIG = {
  common: { label: 'Common', color: 'hsl(220, 10%, 55%)', multiplier: 1 },
  uncommon: { label: 'Uncommon', color: 'hsl(142, 70%, 45%)', multiplier: 1.15 },
  rare: { label: 'Rare', color: 'hsl(210, 90%, 55%)', multiplier: 1.35 },
  legendary: { label: 'Legendary', color: 'hsl(280, 80%, 60%)', multiplier: 1.6 },
  iconic: { label: 'Iconic', color: 'hsl(40, 90%, 50%)', multiplier: 2 },
};
