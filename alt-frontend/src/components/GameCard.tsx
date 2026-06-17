import { motion } from 'framer-motion';
import { PlayerCard, SPORT_CONFIG, RARITY_CONFIG } from '@/lib/types';

interface GameCardProps {
  card: PlayerCard;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export default function GameCard({ card, onClick, selected, compact }: GameCardProps) {
  const sport = SPORT_CONFIG[card.sport];
  const rarity = RARITY_CONFIG[card.rarity];

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl overflow-hidden card-holographic transition-all ${
        selected ? 'ring-2 ring-primary glow-gold' : ''
      } ${compact ? 'w-40' : 'w-52'}`}
      style={{ borderTop: `3px solid ${rarity.color}` }}
    >
      {/* Card body */}
      <div className="bg-card p-3 relative z-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: rarity.color }}>{rarity.label}</span>
          <span className="text-lg">{sport.icon}</span>
        </div>

        {/* Image placeholder */}
        <div className="aspect-[3/4] rounded-lg bg-secondary flex items-center justify-center mb-3 overflow-hidden">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-1">{sport.icon}</div>
              <p className="text-xs text-muted-foreground">{card.position}</p>
            </div>
          )}
        </div>

        {/* Name & team */}
        <h3 className="font-display text-sm leading-tight truncate">{card.playerName}</h3>
        <p className="text-xs text-muted-foreground truncate">{card.team} · {card.year}</p>

        {/* Overall rating badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-sm font-bold ${
            card.overallRating >= 90 ? 'bg-gold-gradient text-primary-foreground' :
            card.overallRating >= 75 ? 'bg-secondary text-foreground' :
            'bg-muted text-muted-foreground'
          }`}>
            {card.overallRating}
          </div>
        </div>

        {/* Stats bar */}
        {!compact && (
          <div className="mt-3 space-y-1">
            {Object.entries(card.stats).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-muted-foreground w-10 font-medium">{key.slice(0, 3)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background: val >= 85 ? `linear-gradient(90deg, hsl(var(--gold-dark)), hsl(var(--gold)))` :
                                  val >= 70 ? `hsl(var(--gold) / 0.6)` : `hsl(var(--muted-foreground) / 0.4)`
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-5 text-right">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Value */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Est. Value</span>
          <span className="text-xs font-semibold text-gold">${card.estimatedValue}</span>
        </div>
      </div>
    </motion.div>
  );
}
