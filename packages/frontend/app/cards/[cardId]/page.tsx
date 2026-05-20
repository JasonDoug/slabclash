'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cardApi, type CardDetail } from '@/lib/api/client'
import { updateCardMetadataSchema, type UpdateCardMetadataFormData, conditionLabels, rarityConfig } from '@/lib/validation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  Edit, 
  ArrowLeft, 
  Plus, 
  AlertCircle,
  Calendar,
  Layers,
  Award,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Mock card for demo
const mockCard: CardDetail = {
  id: '1',
  userId: '1',
  player: 'Michael Jordan',
  year: 1986,
  set: 'Fleer',
  variant: 'Rookie',
  condition: 'near_mint',
  powerScore: 98,
  rarity: 'legendary',
  imageUrlFront: '',
  imageUrlBack: '',
  stats: {
    attack: 95,
    defense: 88,
    speed: 92,
    special: 99,
  },
  estimatedValue: 500000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  powerBreakdown: {
    baseScore: 70,
    conditionMultiplier: 1.3,
    rarityBonus: 15,
    setBonus: 5,
    total: 98,
  },
}

export default function CardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showBack, setShowBack] = useState(false)

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  const { data: card, isLoading, error } = useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      try {
        const response = await cardApi.getById(cardId)
        return response.data
      } catch {
        // Return mock data for demo
        return { ...mockCard, id: cardId }
      }
    },
    enabled: !!cardId,
  })

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-[2.5/3.5] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-20">
          <p className="text-destructive">Card not found</p>
          <Link href="/collection">
            <Button variant="outline" className="mt-4">
              Back to Collection
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  const rarity = rarityConfig[card.rarity] || rarityConfig.common
  const rarityGlowClass = {
    legendary: 'rarity-legendary',
    epic: 'rarity-epic',
    rare: 'rarity-rare',
    uncommon: 'rarity-uncommon',
    common: '',
  }[card.rarity] || ''

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Back button */}
        <Link href="/collection" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Collection
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Card Image */}
          <div className="space-y-4">
            <div
              className={cn(
                'card-shine relative aspect-[2.5/3.5] overflow-hidden rounded-xl border border-border bg-card',
                rarityGlowClass
              )}
            >
              {card.imageUrlFront || card.imageUrlBack ? (
                <Image
                  src={showBack && card.imageUrlBack ? card.imageUrlBack : card.imageUrlFront}
                  alt={`${card.player} ${card.year} ${card.set}`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl font-bold text-muted-foreground/20">
                    {card.player.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Power Score overlay */}
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-sm font-bold backdrop-blur-sm">
                <Zap className="h-4 w-4 text-primary" />
                {card.powerScore}
              </div>
            </div>

            {/* Image toggle */}
            {card.imageUrlBack && (
              <div className="flex justify-center gap-2">
                <Button
                  variant={!showBack ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBack(false)}
                >
                  Front
                </Button>
                <Button
                  variant={showBack ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowBack(true)}
                >
                  Back
                </Button>
              </div>
            )}
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold">{card.player}</h1>
                <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={cn(rarity.className)}>
                  {rarity.label}
                </Badge>
                <Badge variant="outline">{conditionLabels[card.condition] || card.condition}</Badge>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Year
                </div>
                <p className="mt-1 text-lg font-semibold">{card.year}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  Set
                </div>
                <p className="mt-1 text-lg font-semibold">{card.set}</p>
              </div>
              {card.variant && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    Variant
                  </div>
                  <p className="mt-1 text-lg font-semibold">{card.variant}</p>
                </div>
              )}
              {card.estimatedValue && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    Est. Value
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    ${card.estimatedValue.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Power Breakdown */}
            {card.powerBreakdown && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Zap className="h-4 w-4 text-primary" />
                  Power Breakdown
                </h3>
                <div className="space-y-3">
                  <PowerBar label="Base Score" value={card.powerBreakdown.baseScore} max={100} />
                  <PowerBar
                    label="Condition Bonus"
                    value={Math.round((card.powerBreakdown.conditionMultiplier - 1) * 100)}
                    max={50}
                    suffix="%"
                  />
                  <PowerBar label="Rarity Bonus" value={card.powerBreakdown.rarityBonus} max={20} />
                  <PowerBar label="Set Bonus" value={card.powerBreakdown.setBonus} max={10} />
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="font-semibold">Total Power</span>
                    <span className="text-xl font-bold text-primary">{card.powerBreakdown.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            {card.stats && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 font-semibold">Battle Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatBar label="Attack" value={card.stats.attack} color="text-destructive" />
                  <StatBar label="Defense" value={card.stats.defense} color="text-chart-3" />
                  <StatBar label="Speed" value={card.stats.speed} color="text-chart-4" />
                  <StatBar label="Special" value={card.stats.special} color="text-chart-2" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/lineup?addCard=${card.id}`} className="flex-1">
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Lineup
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <EditCardModal
        card={card}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['card', cardId] })
        }}
      />
    </div>
  )
}

function PowerBar({
  label,
  value,
  max,
  suffix = '',
}: {
  label: string
  value: number
  max: number
  suffix?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium', color)}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full bg-current transition-all duration-500', color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function EditCardModal({
  card,
  open,
  onOpenChange,
  onSuccess,
}: {
  card: CardDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateCardMetadataFormData>({
    resolver: zodResolver(updateCardMetadataSchema),
    defaultValues: {
      player: card.player,
      year: card.year,
      set: card.set,
      variant: card.variant || '',
      condition: card.condition as UpdateCardMetadataFormData['condition'],
    },
  })

  const condition = watch('condition')

  const mutation = useMutation({
    mutationFn: async (data: UpdateCardMetadataFormData) => {
      await cardApi.updateMetadata(card.id, data)
    },
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update card')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Card Details</DialogTitle>
          <DialogDescription>Update the metadata for this card</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-player">Player Name</Label>
            <Input
              id="edit-player"
              {...register('player')}
              className={errors.player ? 'border-destructive' : ''}
            />
            {errors.player && (
              <p className="text-xs text-destructive">{errors.player.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                {...register('year', { valueAsNumber: true })}
                className={errors.year ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-set">Set</Label>
              <Input id="edit-set" {...register('set')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-variant">Variant</Label>
            <Input id="edit-variant" {...register('variant')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-condition">Condition</Label>
            <Select
              value={condition}
              onValueChange={(value) => setValue('condition', value as UpdateCardMetadataFormData['condition'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(conditionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
