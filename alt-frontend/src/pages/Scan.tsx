import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Plus } from 'lucide-react';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import { useCollection } from '@/lib/store';
import { createCard } from '@/lib/cardUtils';
import { Sport, SPORT_CONFIG, PlayerCard } from '@/lib/types';

export default function Scan() {
  const { addCard } = useCollection();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [team, setTeam] = useState('');
  const [sport, setSport] = useState<Sport>('baseball');
  const [position, setPosition] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [newCard, setNewCard] = useState<PlayerCard | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!playerName || !team) return;
    const card = createCard({ playerName, team, sport, year, position, imageUrl: imagePreview || undefined });
    setNewCard(card);
    addCard(card);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-secondary text-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-2xl">
        <h1 className="font-display text-3xl mb-2">Scan & Create Card</h1>
        <p className="text-muted-foreground mb-8">Upload a photo of your trading card or enter details manually.</p>

        <AnimatePresence mode="wait">
          {!newCard ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Upload area */}
              <div
                onClick={() => fileRef.current?.click()}
                className="surface-elevated rounded-xl p-8 text-center cursor-pointer hover:bg-surface-hover transition-colors mb-6"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Card preview" className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Upload Card Photo</p>
                      <p className="text-sm text-muted-foreground">Click or drag to upload</p>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </div>

              {/* Form */}
              <div className="grid gap-4">
                {/* Sport selector */}
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(SPORT_CONFIG) as Sport[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSport(s)}
                      className={`p-3 rounded-lg text-center transition-colors ${
                        sport === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
                      }`}
                    >
                      <span className="text-xl block">{SPORT_CONFIG[s].icon}</span>
                      <span className="text-xs font-medium">{SPORT_CONFIG[s].label}</span>
                    </button>
                  ))}
                </div>

                <input placeholder="Player Name *" value={playerName} onChange={e => setPlayerName(e.target.value)} className={inputClass} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Team *" value={team} onChange={e => setTeam(e.target.value)} className={inputClass} />
                  <input placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} className={inputClass} />
                </div>
                <input type="number" placeholder="Year" value={year} onChange={e => setYear(Number(e.target.value))} className={inputClass} />

                <button
                  onClick={handleCreate}
                  disabled={!playerName || !team}
                  className="w-full py-4 rounded-xl bg-gold-gradient text-primary-foreground font-display text-lg font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Generate Card
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <h2 className="font-display text-2xl mb-6 text-gold-gradient">Card Created!</h2>
              <div className="flex justify-center mb-8">
                <GameCard card={newCard} />
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { setNewCard(null); setPlayerName(''); setTeam(''); setPosition(''); setImagePreview(null); }}
                  className="px-6 py-3 rounded-xl border border-border text-foreground font-display hover:bg-surface-hover transition-colors"
                >
                  Scan Another
                </button>
                <button
                  onClick={() => navigate('/collection')}
                  className="px-6 py-3 rounded-xl bg-gold-gradient text-primary-foreground font-display hover:opacity-90 transition-opacity"
                >
                  View Collection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
