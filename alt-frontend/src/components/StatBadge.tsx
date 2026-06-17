interface StatBadgeProps {
  label: string;
  value: number | string;
  variant?: 'default' | 'win' | 'loss' | 'gold';
}

export default function StatBadge({ label, value, variant = 'default' }: StatBadgeProps) {
  const colors = {
    default: 'bg-secondary text-secondary-foreground',
    win: 'bg-win/15 text-win',
    loss: 'bg-loss/15 text-loss',
    gold: 'bg-primary/15 text-primary',
  };

  return (
    <div className={`rounded-lg px-4 py-3 text-center ${colors[variant]}`}>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
    </div>
  );
}
