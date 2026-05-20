'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { matchApi, type MatchResult, type CardDetail } from '@/lib/api/client'
import { rarityConfig } from '@/lib/validation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Zap, 
  ArrowLeft, 
  Trophy,
  Crown,
  Coins,
  Star,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Mock match result for demo
const mockMatchResult: MatchResult = {
  id: '1',
  player1: {
    userId: '1',
    username: 'You',
    lineup: {
      id: '1',
      userId: '1',
      name: 'Championship Lineup',
      cards: [],
      totalPower: 787,
      createdAt: '',
      updatedAt: '',
    },
    totalScore: 5,
  },
  player2: {
    userId: '2',
    username: 'CardMaster99',
    lineup: {
      id: '2',
      userId: '2',
      name: 'Ultimate Team',
      cards: [],
      totalPower: 745,
      createdAt: '',
      updatedAt: '',
    },
    totalScore: 4,
  },
  winnerId: '1',
  positionResults: [
    {
      position: 1,
      player1Card: { id: '1', userId: '1', player: 'Michael Jordan', year: 1986, set: 'Fleer', condition: 'near_mint', powerScore: 98, rarity: 'legendary', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '10', userId: '2', player: 'Larry Bird', year: 1980, set: 'Topps', condition: 'excellent', powerScore: 92, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 98,
      player2Score: 92,
      winnerId: '1',
    },
    {
      position: 2,
      player1Card: { id: '2', userId: '1', player: 'LeBron James', year: 2003, set: 'Topps Chrome', condition: 'mint', powerScore: 95, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '11', userId: '2', player: 'Wilt Chamberlain', year: 1961, set: 'Fleer', condition: 'good', powerScore: 97, rarity: 'legendary', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 95,
      player2Score: 97,
      winnerId: '2',
    },
    {
      position: 3,
      player1Card: { id: '3', userId: '1', player: 'Kobe Bryant', year: 1996, set: 'Topps', condition: 'excellent', powerScore: 89, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '12', userId: '2', player: 'Hakeem Olajuwon', year: 1984, set: 'Star', condition: 'near_mint', powerScore: 85, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 89,
      player2Score: 85,
      winnerId: '1',
    },
    {
      position: 4,
      player1Card: { id: '4', userId: '1', player: 'Stephen Curry', year: 2009, set: 'Panini Prizm', condition: 'near_mint', powerScore: 82, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '13', userId: '2', player: 'Isiah Thomas', year: 1981, set: 'Topps', condition: 'good', powerScore: 79, rarity: 'uncommon', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 82,
      player2Score: 79,
      winnerId: '1',
    },
    {
      position: 5,
      player1Card: { id: '5', userId: '1', player: 'Giannis Antetokounmpo', year: 2013, set: 'Hoops', condition: 'good', powerScore: 76, rarity: 'uncommon', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '14', userId: '2', player: 'David Robinson', year: 1989, set: 'Fleer', condition: 'mint', powerScore: 88, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 76,
      player2Score: 88,
      winnerId: '2',
    },
    {
      position: 6,
      player1Card: { id: '6', userId: '1', player: 'Luka Doncic', year: 2018, set: 'Prizm', condition: 'mint', powerScore: 85, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '15', userId: '2', player: 'Karl Malone', year: 1985, set: 'Star', condition: 'excellent', powerScore: 81, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 85,
      player2Score: 81,
      winnerId: '1',
    },
    {
      position: 7,
      player1Card: { id: '7', userId: '1', player: 'Kevin Durant', year: 2007, set: 'Topps', condition: 'near_mint', powerScore: 88, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '16', userId: '2', player: 'Julius Erving', year: 1976, set: 'Topps', condition: 'fair', powerScore: 86, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 88,
      player2Score: 86,
      winnerId: '1',
    },
    {
      position: 8,
      player1Card: { id: '8', userId: '1', player: 'Tim Duncan', year: 1997, set: 'Fleer', condition: 'excellent', powerScore: 84, rarity: 'rare', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '17', userId: '2', player: 'John Stockton', year: 1984, set: 'Star', condition: 'near_mint', powerScore: 78, rarity: 'uncommon', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 84,
      player2Score: 78,
      winnerId: '1',
    },
    {
      position: 9,
      player1Card: { id: '9', userId: '1', player: 'Shaquille O\'Neal', year: 1992, set: 'Topps', condition: 'good', powerScore: 90, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player2Card: { id: '18', userId: '2', player: 'Patrick Ewing', year: 1985, set: 'Fleer', condition: 'excellent', powerScore: 91, rarity: 'epic', imageUrlFront: '', createdAt: '', updatedAt: '' },
      player1Score: 90,
      player2Score: 91,
      winnerId: '2',
    },
  ],
  rewards: {
    winnerId: '1',
    xpGained: 250,
    coinsGained: 500,
  },
  createdAt: new Date().toISOString(),
}

export default function MatchResultPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  // Fetch match result
  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      try {
        const response = await matchApi.getById(matchId)
        return response.data
      } catch {
        return { ...mockMatchResult, id: matchId }
      }
    },
    enabled: !!matchId,
  })

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="mx-auto h-20 w-48" />
          <Skeleton className="mx-auto mt-8 h-32 w-full max-w-lg" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20">
          <p className="text-destructive">Match not found</p>
          <Link href="/collection">
            <Button variant="outline" className="mt-4">
              Back to Collection
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  const isWinner = match.winnerId === user?.id
  const currentPlayer = match.player1.userId === user?.id ? match.player1 : match.player2
  const opponent = match.player1.userId === user?.id ? match.player2 : match.player1

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Link href="/collection" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Collection
        </Link>

        {/* Result Header */}
        <div className={cn(
          'mb-8 overflow-hidden rounded-2xl border',
          isWinner 
            ? 'border-success/50 bg-gradient-to-br from-success/20 via-success/10 to-transparent' 
            : 'border-destructive/50 bg-gradient-to-br from-destructive/20 via-destructive/10 to-transparent'
        )}>
          <div className="p-8 text-center">
            <div className={cn(
              'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
              isWinner ? 'bg-success/20' : 'bg-destructive/20'
            )}>
              {isWinner ? (
                <Crown className="h-10 w-10 text-success" />
              ) : (
                <Trophy className="h-10 w-10 text-destructive" />
              )}
            </div>
            <h1 className={cn(
              'text-4xl font-bold',
              isWinner ? 'text-success' : 'text-destructive'
            )}>
              {isWinner ? 'Victory!' : 'Defeat'}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {currentPlayer.totalScore} - {opponent.totalScore} vs {opponent.username}
            </p>
          </div>

          {/* Rewards */}
          {isWinner && (
            <div className="border-t border-border bg-background/50 px-8 py-4">
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="font-semibold">+{match.rewards.xpGained} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-semibold">+{match.rewards.coinsGained} Coins</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Score Summary */}
        <div className="mb-8 grid grid-cols-3 items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">You</div>
            <div className="text-3xl font-bold">{currentPlayer.totalScore}</div>
            <Badge variant="outline" className="mt-1 gap-1">
              <Zap className="h-3 w-3 text-primary" />
              {currentPlayer.lineup.totalPower}
            </Badge>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-muted-foreground">VS</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">{opponent.username}</div>
            <div className="text-3xl font-bold">{opponent.totalScore}</div>
            <Badge variant="outline" className="mt-1 gap-1">
              <Zap className="h-3 w-3 text-primary" />
              {opponent.lineup.totalPower}
            </Badge>
          </div>
        </div>

        {/* Position Results */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Position Results</h2>
          {match.positionResults.map((result) => (
            <PositionResultCard
              key={result.position}
              result={result}
              isPlayer1={match.player1.userId === user?.id}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Link href="/collection" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Collection
            </Button>
          </Link>
          <Link href="/lineup" className="flex-1">
            <Button className="w-full gap-2">
              Play Again
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

function PositionResultCard({ 
  result, 
  isPlayer1 
}: { 
  result: MatchResult['positionResults'][0]
  isPlayer1: boolean 
}) {
  const myCard = isPlayer1 ? result.player1Card : result.player2Card
  const oppCard = isPlayer1 ? result.player2Card : result.player1Card
  const myScore = isPlayer1 ? result.player1Score : result.player2Score
  const oppScore = isPlayer1 ? result.player2Score : result.player1Score
  const won = (isPlayer1 && result.winnerId === result.player1Card.userId) || 
              (!isPlayer1 && result.winnerId === result.player2Card.userId)

  const myRarity = rarityConfig[myCard.rarity] || rarityConfig.common
  const oppRarity = rarityConfig[oppCard.rarity] || rarityConfig.common

  return (
    <div className={cn(
      'flex items-center gap-4 rounded-lg border p-3 transition-colors',
      won ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'
    )}>
      {/* Position */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
        {result.position}
      </div>

      {/* My Card */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
          {myCard.imageUrlFront ? (
            <Image src={myCard.imageUrlFront} alt={myCard.player} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground/50">
              {myCard.player.slice(0, 2)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{myCard.player}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', myRarity.className)}>
              {myScore}
            </Badge>
          </div>
        </div>
      </div>

      {/* VS */}
      <div className={cn(
        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
        won ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
      )}>
        {won ? 'W' : 'L'}
      </div>

      {/* Opponent Card */}
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm font-medium">{oppCard.player}</p>
          <div className="flex items-center justify-end gap-2">
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', oppRarity.className)}>
              {oppScore}
            </Badge>
          </div>
        </div>
        <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
          {oppCard.imageUrlFront ? (
            <Image src={oppCard.imageUrlFront} alt={oppCard.player} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground/50">
              {oppCard.player.slice(0, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
