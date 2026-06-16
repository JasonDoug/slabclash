'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, authApi, scanApi, lineupApi, matchApi, type WarMatchResult, type User } from '@/lib/api/client'
import { Loader2, Swords, CheckCircle2, UserPlus, Upload, Layout, Play, History } from 'lucide-react'

interface LogEntry {
  message: string
  type: 'info' | 'success' | 'error' | 'war'
  timestamp: Date
}

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [result, setResult] = useState<WarMatchResult | null>(null)
  const [users, setUsers] = useState<{ a: User | null; b: User | null }>({ a: null, b: null })

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ message, type, timestamp: new Date() }, ...prev])
  }

  const runDemo = async () => {
    setLoading(true)
    setLogs([])
    setResult(null)
    
    try {
      // 0. Health Check
      addLog('Checking backend connection...')
      try {
        await apiClient.get('health')
        addLog('Backend is online', 'success')
      } catch (err: any) {
        throw new Error(`Backend unreachable: ${err.message}. Ensure "yarn dev:backend" is running.`)
      }

      // 1. Setup Users
      addLog('Setting up demo users...')
      const timestamp = Date.now()
      
      const signupA = await authApi.signup({
        username: `playerA_${timestamp}`,
        email: `a_${timestamp}@demo.com`,
        password: 'Password123!'
      })
      const userA = signupA.data.user
      const tokenA = signupA.data.accessToken
      
      const signupB = await authApi.signup({
        username: `playerB_${timestamp}`,
        email: `b_${timestamp}@demo.com`,
        password: 'Password123!'
      })
      const userB = signupB.data.user
      const tokenB = signupB.data.accessToken

      setUsers({ a: userA, b: userB })
      addLog(`Users created: ${userA.username} and ${userB.username}`, 'success')

      // 2. Ingest Cards
      addLog('Ingesting 18 baseball cards (9 per user)...')
      
      const ingestCards = async (token: string, userLabel: string, baseStat: number) => {
        const cardIds: string[] = []
        for (let i = 0; i < 9; i++) {
          const config = { headers: { Authorization: `Bearer ${token}` } }
          
          // Start Job
          const upload = await apiClient.post('scan/upload', { frontFileName: `card_${i}.jpg` }, config)
          const scanJobId = upload.data.scanJobId
          
          // Confirm immediately (skipping process for demo speed, backend allows direct confirm if jobId exists)
          const confirm = await apiClient.post(`scan/confirm/${scanJobId}`, {
            playerId: 'p1', // Marcus Ramirez
            year: 2018,
            setName: 'Topps',
            conditionReported: 'mint',
            confirm: true,
            playerStats: baseStat + i
          }, config)
          
          cardIds.push(confirm.data.cardId)
        }
        return cardIds
      }

      const cardsA = await ingestCards(tokenA, 'A', 80)
      addLog('User A cards ingested (Stats 80-88)', 'success')
      
      const cardsB = await ingestCards(tokenB, 'B', 75)
      addLog('User B cards ingested (Stats 75-83)', 'success')

      // 3. Create Lineups
      addLog('Creating 9-slot lineups...')
      
      const createLineup = async (token: string, name: string, cardIds: string[]) => {
        const slots: Record<string, string> = {}
        cardIds.forEach((id, i) => { slots[`pos${i}`] = id })
        
        return apiClient.post('lineups', { name, slots }, { headers: { Authorization: `Bearer ${token}` } })
      }

      const lineupA = await createLineup(tokenA, 'War Team A', cardsA)
      const lineupB = await createLineup(tokenB, 'War Team B', cardsB)
      addLog('Lineups ready for battle', 'success')

      // 4. Resolve War Battle
      addLog('⚔️ INITIALIZING WAR BATTLE ⚔️', 'war')
      const battle = await apiClient.post('match/resolve', {
        lineupA: { slots: lineupA.data.slots },
        lineupB: { slots: lineupB.data.slots },
        matchSeed: `war_${timestamp}`,
        isWar: true
      }, { headers: { Authorization: `Bearer ${tokenA}` } })

      setResult(battle.data)
      addLog(`Battle Complete! Winner: ${battle.data.winner === 'A' ? userA.username : userB.username}`, 'success')
      
      battle.data.events.forEach((e: any) => {
        if (e.type === 'war_transfer') {
          addLog(e.description, 'war')
        }
      })

    } catch (error: any) {
      console.error(error)
      addLog(`Error: ${error.response?.data?.message || error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">War Battle Demo</h1>
            <p className="text-muted-foreground">Demo the full lifecycle: Ingestion → Lineup → War Battle → Card Theft</p>
          </div>
          <Button size="lg" onClick={runDemo} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            Run Full Demo
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Logs Section */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Execution Log
              </CardTitle>
              <CardDescription>Real-time progress of the demo</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {logs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <History className="mb-4 h-12 w-12 opacity-20" />
                    <p>Click "Run Full Demo" to start</p>
                  </div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className={`rounded-lg border p-3 text-sm ${
                    log.type === 'success' ? 'border-green-500/50 bg-green-500/10' :
                    log.type === 'error' ? 'border-red-500/50 bg-red-500/10' :
                    log.type === 'war' ? 'border-primary/50 bg-primary/10 font-bold' :
                    'border-border bg-muted/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="opacity-50 text-[10px]">{log.timestamp.toLocaleTimeString()}</span>
                      {log.type === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    </div>
                    {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5" />
                  Match Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <Swords className="mb-4 h-12 w-12 opacity-20" />
                    <p>Results will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-12 py-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Player A</div>
                        <div className="text-4xl font-bold">{result.scoreA}</div>
                        {result.winner === 'A' && <div className="mt-1 text-xs font-bold text-green-500 uppercase tracking-wider">Winner</div>}
                      </div>
                      <div className="text-xl font-bold opacity-30">VS</div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Player B</div>
                        <div className="text-4xl font-bold">{result.scoreB}</div>
                        {result.winner === 'B' && <div className="mt-1 text-xs font-bold text-green-500 uppercase tracking-wider">Winner</div>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold uppercase tracking-wider opacity-50">Position Breakdown</h4>
                      {result.perPositionResults.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md border bg-muted/30 p-2 text-sm">
                          <span className="font-mono">{r.position}</span>
                          <div className="flex items-center gap-4">
                            <span className={r.winner === 'A' ? 'font-bold text-green-500' : ''}>{r.statA}</span>
                            <span className="opacity-30">vs</span>
                            <span className={r.winner === 'B' ? 'font-bold text-green-500' : ''}>{r.statB}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase">{r.winner === 'draw' ? 'Draw' : `Winner ${r.winner}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Step 1: Ingestion</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed opacity-50">
                    <Upload className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Step 2: Lineup</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed opacity-50">
                    <Layout className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
