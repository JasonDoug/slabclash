import { useState, useCallback } from 'react';
import { PlayerCard, BattleResult } from './types';
import { generateSampleCollection } from './cardUtils';

const STORAGE_KEY = 'cardclash_collection';
const BATTLE_KEY = 'cardclash_battles';

function loadCollection(): PlayerCard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const sample = generateSampleCollection();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  return sample;
}

function loadBattles(): BattleResult[] {
  try {
    const stored = localStorage.getItem(BATTLE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function useCollection() {
  const [cards, setCards] = useState<PlayerCard[]>(loadCollection);
  const [battles, setBattles] = useState<BattleResult[]>(loadBattles);

  const addCard = useCallback((card: PlayerCard) => {
    setCards(prev => {
      const next = [card, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addBattle = useCallback((result: BattleResult) => {
    setBattles(prev => {
      const next = [result, ...prev.slice(0, 49)];
      localStorage.setItem(BATTLE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const wins = battles.filter(b => b.won).length;
  const losses = battles.length - wins;

  return { cards, addCard, battles, addBattle, wins, losses };
}
