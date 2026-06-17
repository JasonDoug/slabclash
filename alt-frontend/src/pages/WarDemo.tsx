import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, CheckCircle2, History, Swords, Shield, Zap } from 'lucide-react';
import Header from '@/components/Header';
import { authApi, scanApi, lineupApi, matchApi, apiClient } from '@/lib/api-client';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'war';
  timestamp: Date;
}

export default function WarDemo() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ message, type, timestamp: new Date() }, ...prev]);
  };

  const runDemo = async () => {
    setLoading(true);
    setLogs([]);
    setResult(null);

    try {
      // 0. Connection Check
      addLog('Checking backend connection...');
      try {
        await apiClient.get('/health');
        addLog('Backend is online', 'success');
      } catch (err: any) {
        throw new Error('Backend unreachable. Make sure "yarn dev:backend" is running.');
      }

      // 1. Setup Users
      addLog('Initializing War Combatants...');
      const ts = Date.now();
      
      const signupA = await authApi.signup({
        username: `Hero_${ts}`,
        email: `hero_${ts}@demo.com`,
        password: 'Password123!'
      });
      const userA = signupA.data.user;
      const tokenA = signupA.data.accessToken;
      
      localStorage.setItem('auth_token', tokenA);
      localStorage.setItem('user_id', userA.id);

      const signupB = await authApi.signup({
        username: `Villain_${ts}`,
        email: `villain_${ts}@demo.com`,
        password: 'Password123!'
      });
      const userB = signupB.data.user;
      const tokenB = signupB.data.accessToken;

      addLog(`Created users: ${userA.username} vs ${userB.username}`, 'success');

      // 2. Ingest Cards
      addLog('Ingesting 18 baseball cards (9 per user)...');
      
      const ingestCards = async (token: string, baseStat: number) => {
        const cardIds: string[] = [];
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        for (let i = 0; i < 9; i++) {
          const upload = await apiClient.post('/scan/upload', { frontFileName: `card_${i}.jpg` }, config);
          const scanJobId = upload.data.scanJobId;
          
          const confirm = await apiClient.post(`/scan/confirm/${scanJobId}`, {
            playerId: 'p1', // Marcus Ramirez (Seeded in DB)
            year: 2020 + i,
            setName: 'Topps Chrome',
            conditionReported: 'mint',
            confirm: true,
            playerStats: baseStat + i
          }, config);
          
          cardIds.push(confirm.data.cardId);
        }
        return cardIds;
      };

      const cardsA = await ingestCards(tokenA, 85);
      addLog(`Ingested 9 cards for ${userA.username} (Stats 85-93)`, 'success');
      
      const cardsB = await ingestCards(tokenB, 80);
      addLog(`Ingested 9 cards for ${userB.username} (Stats 80-88)`, 'success');

      // 3. Create Lineups
      addLog('Building 9-slot battle lineups...');
      
      const createLineup = async (token: string, name: string, cardIds: string[]) => {
        const slots: Record<string, string> = {};
        cardIds.forEach((id, i) => { slots[`pos${i}`] = id; });
        return apiClient.post('/lineups', { name, slots }, { headers: { Authorization: `Bearer ${token}` } });
      };

      const lineupA = await createLineup(tokenA, 'The Avengers', cardsA);
      const lineupB = await createLineup(tokenB, 'The Syndicate', cardsB);
      addLog('Lineups deployed to front lines', 'success');

      // 4. Resolve War Battle
      addLog('⚔️ COMMENCING WAR BATTLE ⚔️', 'war');
      const battle = await apiClient.post('/match/resolve', {
        lineupA: { slots: lineupA.data.slots },
        lineupB: { slots: lineupB.data.slots },
        matchSeed: `demo_war_${ts}`,
        isWar: true
      }, { headers: { Authorization: `Bearer ${tokenA}` } });

      setResult(battle.data);
      addLog(`WAR COMPLETE! Winner: ${battle.data.winner === 'A' ? userA.username : userB.username}`, 'success');
      
      battle.data.events.forEach((e: any) => {
        if (e.type === 'war_transfer') {
          addLog(e.description, 'war');
        }
      });

    } catch (err: any) {
      console.error(err);
      addLog(`Error: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl mb-2 text-gold-gradient">War Mode Demo</h1>
            <p className="text-muted-foreground">Automatic Ingestion → 9v9 Battle → Card Theft Verification</p>
          </div>
          <button
            onClick={runDemo}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gold-gradient text-primary-foreground font-display text-xl font-bold tracking-widest hover:opacity-90 transition-all glow-gold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
            RUN FULL WAR DEMO
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Logs */}
          <div className="surface-elevated rounded-2xl p-6 h-[600px] flex flex-col border border-border">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl">Battle Logs</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40">
                  <Swords className="w-16 h-16 mb-4" />
                  <p>Click the button to start the demo</p>
                </div>
              )}
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg text-sm border ${
                    log.type === 'success' ? 'bg-win/10 border-win/30' :
                    log.type === 'error' ? 'bg-loss/10 border-loss/30' :
                    log.type === 'war' ? 'bg-primary/20 border-primary/50 font-bold' :
                    'bg-surface-hover border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    {log.type === 'success' && <CheckCircle2 className="w-3 h-3 text-win" />}
                  </div>
                  {log.message}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visualization */}
          <div className="space-y-6">
            <div className="surface-elevated rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl">Battle Outcome</h2>
              </div>
              
              {!result ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground opacity-40">
                  <Zap className="w-12 h-12" />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-around py-4 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="text-center">
                      <p className="text-xs uppercase opacity-50 mb-1">Player A</p>
                      <p className="text-5xl font-display font-bold text-win">{result.scoreA}</p>
                    </div>
                    <div className="text-2xl font-display opacity-20 italic">VS</div>
                    <div className="text-center">
                      <p className="text-xs uppercase opacity-50 mb-1">Player B</p>
                      <p className="text-5xl font-display font-bold text-loss">{result.scoreB}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40 px-2">Position Breakdown</p>
                    <div className="grid grid-cols-1 gap-2">
                      {result.perPositionResults.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg bg-surface-hover text-sm border border-border/50">
                          <span className="font-mono text-xs opacity-50 uppercase">{r.position}</span>
                          <div className="flex items-center gap-4">
                            <span className={r.winner === 'A' ? 'text-win font-bold' : ''}>{r.statA}</span>
                            <span className="opacity-20 italic">vs</span>
                            <span className={r.winner === 'B' ? 'text-win font-bold' : ''}>{r.statB}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${r.winner === 'A' ? 'text-win' : 'text-loss'}`}>
                            {r.winner === 'draw' ? 'Tie' : `Win ${r.winner}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="surface-elevated rounded-xl p-4 border border-border text-center opacity-50">
                <p className="text-[10px] font-bold uppercase mb-2">Ingestion Step</p>
                <div className="h-1 bg-win/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: loading ? '100%' : result ? '100%' : '0%' }} 
                    className="h-full bg-win"
                  />
                </div>
              </div>
              <div className="surface-elevated rounded-xl p-4 border border-border text-center opacity-50">
                <p className="text-[10px] font-bold uppercase mb-2">Lineup Step</p>
                <div className="h-1 bg-win/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: result ? '100%' : '0%' }} 
                    className="h-full bg-win"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
