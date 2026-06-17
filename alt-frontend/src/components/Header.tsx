import { Link, useLocation } from 'react-router-dom';
import { Zap, Library, Swords, Plus, Play } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Zap },
  { to: '/collection', label: 'Collection', icon: Library },
  { to: '/battle', label: 'Battle', icon: Swords },
  { to: '/demo', label: 'War Demo', icon: Play },
  { to: '/scan', label: 'Scan', icon: Plus },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-wider text-gold-gradient">CardClash</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
