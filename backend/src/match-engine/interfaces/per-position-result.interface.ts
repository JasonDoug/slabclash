export interface PerPositionResult {
  position: string;
  cardAId: string;
  cardBId: string;
  statA: number;
  statB: number;
  winner: 'A' | 'B' | 'draw';
  pointsA: number;
  pointsB: number;
}
