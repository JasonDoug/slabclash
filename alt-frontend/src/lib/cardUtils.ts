import { CardStats, PlayerCard, Sport, RARITY_CONFIG } from './types';

export function generateStats(): CardStats {
  return {
    power: Math.floor(Math.random() * 60) + 40,
    speed: Math.floor(Math.random() * 60) + 40,
    defense: Math.floor(Math.random() * 60) + 40,
    skill: Math.floor(Math.random() * 60) + 40,
    clutch: Math.floor(Math.random() * 60) + 40,
  };
}

export function calculateOverall(stats: CardStats, rarity: PlayerCard['rarity']): number {
  const base = (stats.power + stats.speed + stats.defense + stats.skill + stats.clutch) / 5;
  return Math.min(99, Math.round(base * RARITY_CONFIG[rarity].multiplier));
}

export function determineRarity(): PlayerCard['rarity'] {
  const roll = Math.random();
  if (roll < 0.02) return 'iconic';
  if (roll < 0.08) return 'legendary';
  if (roll < 0.22) return 'rare';
  if (roll < 0.48) return 'uncommon';
  return 'common';
}

export function estimateValue(overall: number, rarity: PlayerCard['rarity']): number {
  const base = overall * 2;
  const rarityMult = { common: 1, uncommon: 3, rare: 8, legendary: 25, iconic: 100 };
  return Math.round(base * rarityMult[rarity] * (0.8 + Math.random() * 0.4));
}

export function createCard(data: { playerName: string; team: string; sport: Sport; year: number; position: string; imageUrl?: string }): PlayerCard {
  const stats = generateStats();
  const rarity = determineRarity();
  const overallRating = calculateOverall(stats, rarity);
  return {
    id: crypto.randomUUID(),
    ...data,
    stats,
    rarity,
    overallRating,
    estimatedValue: estimateValue(overallRating, rarity),
    createdAt: new Date(),
  };
}

export function simulateBattle(card1: PlayerCard, card2: PlayerCard): { score1: number; score2: number } {
  const calc = (c: PlayerCard) => {
    const base = c.overallRating;
    const luck = Math.random() * 20 - 10;
    const clutchBonus = c.stats.clutch > 80 ? Math.random() * 8 : 0;
    return Math.round(base + luck + clutchBonus);
  };
  return { score1: calc(card1), score2: calc(card2) };
}

// Sample cards for demo
const SAMPLE_PLAYERS: Array<{ playerName: string; team: string; sport: Sport; position: string; year: number }> = [
  { playerName: 'Mike Trout', team: 'Angels', sport: 'baseball', position: 'CF', year: 2023 },
  { playerName: 'Shohei Ohtani', team: 'Dodgers', sport: 'baseball', position: 'DH/SP', year: 2024 },
  { playerName: 'Patrick Mahomes', team: 'Chiefs', sport: 'football', position: 'QB', year: 2023 },
  { playerName: 'LeBron James', team: 'Lakers', sport: 'basketball', position: 'SF', year: 2024 },
  { playerName: 'Connor McDavid', team: 'Oilers', sport: 'hockey', position: 'C', year: 2024 },
  { playerName: 'Aaron Judge', team: 'Yankees', sport: 'baseball', position: 'RF', year: 2023 },
];

export function generateSampleCollection(): PlayerCard[] {
  return SAMPLE_PLAYERS.map(p => createCard(p));
}
