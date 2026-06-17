import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Library, ScanLine, Trophy } from 'lucide-react';
import Header from '@/components/Header';

const FEATURES = [
  { icon: ScanLine, title: 'Scan Cards', desc: 'Upload your real trading cards and convert them into digital battle assets.', to: '/scan' },
  { icon: Library, title: 'Build Collection', desc: 'Manage your digital collection across baseball, football, basketball & hockey.', to: '/collection' },
  { icon: Swords, title: 'Battle Online', desc: 'Challenge opponents in head-to-head matchups. Your cards, your strategy.', to: '/battle' },
  { icon: Trophy, title: 'Climb Ranks', desc: 'Win battles, earn rewards, and build the ultimate collection.', to: '/battle' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.08),transparent_60%)]" />
        <div className="container relative py-24 md:py-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
              Season 1 is Live
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-[0.95] mb-6">
              Your Cards.<br />
              <span className="text-gold-gradient">Your Battle.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Scan real trading cards, unlock digital power ratings, and battle head-to-head with collectors worldwide.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/demo" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gold-gradient text-primary-foreground font-display font-bold text-lg tracking-widest hover:scale-105 transition-all glow-gold">
                <Swords className="w-6 h-6" /> RUN WAR DEMO
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Link to={f.to} className="block surface-elevated rounded-xl p-6 hover:bg-surface-hover transition-colors group">
                <f.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-display text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sports */}
      <section className="container pb-24 text-center">
        <h2 className="font-display text-3xl mb-8">All Major Sports</h2>
        <div className="flex justify-center gap-8 text-5xl">
          {['⚾', '🏈', '🏀', '🏒'].map((e, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
              className="hover:scale-125 transition-transform cursor-default"
            >
              {e}
            </motion.span>
          ))}
        </div>
      </section>
    </div>
  );
}
