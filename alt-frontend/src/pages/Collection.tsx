import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import StatBadge from '@/components/StatBadge';
import { useCollection } from '@/lib/store';
import { Sport, SPORT_CONFIG } from '@/lib/types';

export default function Collection() {
  const { cards, wins, losses } = useCollection();
  const [filter, setFilter] = useState<Sport | 'all'>('all');

  const filtered = filter === 'all' ? cards : cards.filter(c => c.sport === filter);
  const totalValue = cards.reduce((sum, c) => sum + c.estimatedValue, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatBadge label="Cards" value={cards.length} variant="gold" />
          <StatBadge label="Total Value" value={`$${totalValue.toLocaleString()}`} variant="default" />
          <StatBadge label="Wins" value={wins} variant="win" />
          <StatBadge label="Losses" value={losses} variant="loss" />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
            }`}
          >
            All ({cards.length})
          </button>
          {(Object.keys(SPORT_CONFIG) as Sport[]).map(s => {
            const count = cards.filter(c => c.sport === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
                }`}
              >
                {SPORT_CONFIG[s].icon} {SPORT_CONFIG[s].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <AnimatePresence mode="popLayout">
            {filtered.map(card => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <GameCard card={card} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No cards in this category yet.</p>
        )}
      </div>
    </div>
  );
}
