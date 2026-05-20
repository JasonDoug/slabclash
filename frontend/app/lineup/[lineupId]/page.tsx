'use client'

import { use, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lineupApi, matchmakingApi, type Lineup, type MatchmakingStatus } from '@/lib/api/client'
import { rarityConfig } from '@/lib/validation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  ArrowLeft, 
  Swords, 
  Users,
  AlertCircle,
  Clock,
  X,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Mock lineup for demo
const mockLineup: Lineup = {
  id: '1',
  userId: '1',
  name: 'Championship Lineup',
  cards: [
    { cardId: '1', position: 1, card: { id: '1', userId: '1', player: 'Michael Jordan', year: 1986, set: 'Fleer', condition: 'near_mint', powerScore: 98, rarity: 'legendary', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '2', position: 2, card: { id: '2', userId: '1', player: 'LeBron James', year: 2003, set: 'Topps Chrome', condition: 'mint', powerScore: 95, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '3', position: 3, card: { id: '3', userId: '1', player: 'Kobe Bryant', year: 1996, set: 'Topps', condition: 'excellent', powerScore: 89, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '4', position: 4, card: { id: '4', userId: '1', player: 'Stephen Curry', year: 2009, set: 'Panini Prizm', condition: 'near_mint', powerScore: 82, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '5', position: 5, card: { id: '5', userId: '1', player: 'Giannis Antetokounmpo', year: 2013, set: 'Hoops', condition: 'good', powerScore: 76, rarity: 'uncommon', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '6', position: 6, card: { id: '6', userId: '1', player: 'Luka Doncic', year: 2018, set: 'Prizm', condition: 'mint', powerScore: 85, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '7', position: 7, card: { id: '7', userId: '1', player: 'Kevin Durant', year: 2007, set: 'Topps', condition: 'near_mint', powerScore: 88, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '8', position: 8, card: { id: '8', userId: '1', player: 'Tim Duncan', year: 1997, set: 'Fleer', condition: 'excellent', powerScore: 84, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' } },
    { cardId: '9', position: 9, card: { id: '9', userId: '1', player: 'Shaquille O\'Neal', year: 1992, set: 'Topps', condition: 'good', powerScore: 90, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' } },
  ],
  totalPower: 787,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export default function LineupDetailPage({ params }: { params: Promise<{ lineupId: string }> }) {
  const { lineupId } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  // Fetch lineup
  const { data: lineup, isLoading } = useQuery({
    queryKey: ['lineup', lineupId],
    queryFn: async () => {
      try {
        const response = await lineupApi.getById(lineupId)
        return response.data
      } catch {
        return { ...mockLineup, id: lineupId }
      }
    },
    enabled: !!lineupId,
  })

  // Fetch matchmaking status
  const { data: matchmakingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['matchmaking-status'],
    queryFn: async () => {
      try {
        const response = await matchmakingApi.getStatus()
        return response.data
      } catch {
        return { inQueue: false }
      }
    },
    refetchInterval: (data) => (data?.state?.data?.inQueue ? 5000 : false),
  })

  // Enqueue mutation
  const enqueueMutation = useMutation({
    mutationFn: async () => {
      await matchmakingApi.enqueue({ lineupId })
    },
    onSuccess: () => {
      refetchStatus()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to join queue')
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await matchmakingApi.cancel()
    },
    onSuccess: () => {
      refetchStatus()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    },
  })

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <div className="mt-8 grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2.5/3.5] rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!lineup) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20">
          <p className="text-destructive">Lineup not found</p>
          <Link href="/lineup">
            <Button variant="outline" className="mt-4">
              Back to Lineup Builder
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  const isInQueue = matchmakingStatus?.inQueue && matchmakingStatus.lineupId === lineupId

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Link href="/lineup" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Lineup Builder
        </Link>

        {/* Matchmaking Queue Banner */}
        {isInQueue && (
          <div className="mb-6 overflow-hidden rounded-lg border border-primary/50 bg-primary/10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Spinner className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Searching for opponent...</p>
                  <p className="text-sm text-muted-foreground">
                    {matchmakingStatus?.position
                      ? `Position ${matchmakingStatus.position} in queue`
                      : 'Finding a match for you'}
                    {matchmakingStatus?.estimatedWaitTime && (
                      <span className="ml-2">
                        (~{Math.ceil(matchmakingStatus.estimatedWaitTime / 60)}min)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </>
                )}
              </Button>
            </div>
            <Progress value={33} className="h-1 rounded-none" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{lineup.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3 text-primary" />
                {lineup.totalPower} Total Power
              </Badge>
              <Badge variant="secondary">9 Cards</Badge>
            </div>
          </div>
          
          {!isInQueue && (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => enqueueMutation.mutate()}
              disabled={enqueueMutation.isPending}
            >
              {enqueueMutation.isPending ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Joining...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  Find Match
                </>
              )}
            </Button>
          )}
        </div>

        {/* Lineup Grid */}
        <div className="grid grid-cols-3 gap-4">
          {lineup.cards
            .sort((a, b) => a.position - b.position)
            .map((lc) => {
              const rarity = rarityConfig[lc.card.rarity] || rarityConfig.common
              return (
                <div
                  key={lc.position}
                  className={cn(
                    'group relative aspect-[2.5/3.5] overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50',
                    lc.card.rarity === 'legendary' && 'rarity-legendary',
                    lc.card.rarity === 'epic' && 'rarity-epic',
                    lc.card.rarity === 'rare' && 'rarity-rare'
                  )}
                >
                  {lc.card.imageUrlFront ? (
                    <Image
                      src={lc.card.imageUrlFront}
                      alt={lc.card.player}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <span className="text-3xl font-bold text-muted-foreground/30">
                        {lc.card.player.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Position badge */}
                  <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-xs font-bold backdrop-blur-sm">
                    {lc.position}
                  </div>

                  {/* Power badge */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                    <Zap className="h-3 w-3 text-primary" />
                    {lc.card.powerScore}
                  </div>

                  {/* Card info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-3">
                    <p className="truncate font-semibold">{lc.card.player}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {lc.card.year} {lc.card.set}
                      </p>
                      <Badge variant="secondary" className={cn('text-[10px] px-1.5', rarity.className)}>
                        {rarity.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Average Power
            </div>
            <p className="mt-1 text-2xl font-bold">
              {Math.round(lineup.totalPower / 9)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Matches Played
            </div>
            <p className="mt-1 text-2xl font-bold">0</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Created
            </div>
            <p className="mt-1 text-2xl font-bold">
              {new Date(lineup.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Live updates placeholder */}
        <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
          <p className="text-muted-foreground">Live match updates coming soon</p>
        </div>
      </main>
    </div>
  )
}
