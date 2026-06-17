import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, RotateCcw, Loader2, Info, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import StatBadge from '@/components/StatBadge';
import { useCollection } from '@/lib/store';
import { PlayerCard } from '@/lib/types';
import { matchApi, cardApi } from '@/lib/api-client';
import { Link } from 'react-router-dom';

type BattlePhase = 'select' | 'fighting' | 'result';

export default function Battle() {
  const { wins, losses } = useCollection();
  const [myCards, setMyCards] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      const res = await cardApi.getMine();
      setMyCards(res.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch cards', err);
      setError('You need to be logged in to see your cards. Use the "War Demo" for an automated test.');
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : prev.length < 9 ? [...prev, id] : prev
    );
  };

  const startBattle = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setPhase('fighting');

    try {
      // Build slots for the backend
      const slots: Record<string, string> = {};
      selectedIds.forEach((id, i) => { slots[`pos${i}`] = id; });

      // Build a dummy opponent lineup with same number of cards for demo
      // In a real app, this would come from matchmaking
      const oppSlots: Record<string, string> = {};
      // We'll just reuse our own cards as "opponent" for the sake of the UI demo
      // but the backend will handle the logic
      selectedIds.forEach((id, i) => { oppSlots[`pos${i}`] = id; });

      const res = await matchApi.resolve({
        lineupA: { slots },
        lineupB: { slots: oppSlots }, 
        isWar: true,
        matchSeed: `war_${Date.now()}`
      });

      setResult(res.data);
      setPhase('result');
    } catch (err: any) {
      console.error('Battle failed', err);
      setPhase('select');
      setLoading(false);
      setError('Battle failed: ' + (err.response?.data?.message || err.message));
    }
  }, [selectedIds]);

  const reset = () => {
    setSelectedIds([]);
    setResult(null);
    setPhase('select');
    fetchCards();
  };

  const mapCard = (c: any): PlayerCard => ({
    id: c.id,
    playerName: c.player?.name || 'Unknown',
    team: c.setName || 'Topps',
    sport: 'baseball',
    year: c.year,
    position: 'P',
    stats: {
      power: c.playerStats || 80,
      speed: 70,
      defense: 75,
      skill: 85,
      clutch: 90
    },
    overallRating: c.powerScore || 80,
    rarity: (c.rarity?.toLowerCase() as any) || 'common',
    estimatedValue: 100,
    createdAt: new Date(c.createdAt)
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">War Arena</h1>
          <div className="flex gap-3">
            <StatBadge label="Wins" value={wins} variant="win" />
            <StatBadge label="Losses" value={losses} variant="loss" />
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-loss/10 border border-loss/20 text-loss flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="text-sm opacity-80">{error}</p>
              <Link to="/demo" className="mt-2 inline-block text-xs font-bold underline">GO TO WAR DEMO PAGE →</Link>
            </div>
          </div>
        )}

        {phase === 'select' && (
          <div>
            <div className="flex justify-between items-end mb-6">
               <div>
                <h2 className="font-display text-xl mb-1">Assemble Your Lineup</h2>
                <p className="text-muted-foreground text-sm">Select up to 9 cards for a WAR battle.</p>
               </div>
               <div className="text-right">
                <p className="text-2xl font-display text-gold-gradient">{selectedIds.length}/9</p>
                <p className="text-[10px] uppercase font-bold opacity-40">Cards Selected</p>
               </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-8">
              {myCards.map(card => (
                <GameCard
                  key={card.id}
                  card={mapCard(card)}
                  compact
                  selected={selectedIds.includes(card.id)}
                  onClick={() => toggleSelect(card.id)}
                />
              ))}
            </div>

            {myCards.length === 0 && !loading && (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl opacity-50">
                <Swords className="w-12 h-12 mx-auto mb-4" />
                <p>Your collection is empty.</p>
                <Link to="/demo" className="text-primary font-bold underline">Try the One-Click Demo instead</Link>
              </div>
            )}

            {selectedIds.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={startBattle}
                  className="inline-flex items-center gap-2 px-12 py-5 rounded-2xl bg-gold-gradient text-primary-foreground font-display text-xl font-bold tracking-widest hover:scale-105 transition-all shadow-2xl glow-gold"
                >
                  <Swords className="w-6 h-6" /> COMMENCE WAR!
                </button>
              </motion.div>
            )}
          </div>
        )}

        {phase === 'fighting' && (
          <div className="flex flex-col items-center justify-center gap-12 py-16">
            <div className="flex items-center justify-center gap-12">
               <div className="relative">
                 <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                 <Swords className="w-32 h-32 text-primary animate-bounce" />
               </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-display text-gold-gradient animate-pulse tracking-widest">RESOLVING WAR...</h2>
              <p className="text-muted-foreground">Each position is battling for ownership.</p>
            </div>
            
            <div className="grid grid-cols-9 gap-2">
              {selectedIds.map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="w-4 h-4 bg-primary rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl mx-auto">
            <CheckCircle2 className="w-20 h-20 text-win mx-auto mb-6" />
            <h2 className="font-display text-5xl mb-4 text-win">War Resolved</h2>
            <p className="mb-8 text-muted-foreground text-lg">
              The cards have been transferred based on the outcome of each position battle.
              Check your collection to see your new acquisitions!
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-12">
              <div className="surface-elevated p-6 rounded-2xl border border-border">
                <p className="text-xs uppercase opacity-50 mb-1">Final Score</p>
                <p className="text-4xl font-display">{result?.scoreA} - {result?.scoreB}</p>
              </div>
              <div className="surface-elevated p-6 rounded-2xl border border-border">
                <p className="text-xs uppercase opacity-50 mb-1">Status</p>
                <p className={`text-xl font-display ${result?.winner === 'A' ? 'text-win' : 'text-loss'}`}>
                  {result?.winner === 'A' ? 'VICTORY' : 'DEFEAT'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={reset}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface-hover text-foreground font-display font-bold hover:bg-border transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Start New War
              </button>
              <Link
                to="/collection"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gold-gradient text-primary-foreground font-display font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                View Collection
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
