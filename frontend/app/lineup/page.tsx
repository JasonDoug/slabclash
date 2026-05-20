'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cardApi, lineupApi, matchmakingApi, type CardDetail, type Lineup } from '@/lib/api/client'
import { createLineupSchema, type CreateLineupFormData, rarityConfig } from '@/lib/validation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { CardGrid } from '@/components/card-grid'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Plus, 
  X, 
  AlertCircle, 
  Save,
  Swords,
  GripVertical,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Suspense } from 'react'

const POSITION_LABELS = [
  'Position 1',
  'Position 2',
  'Position 3',
  'Position 4',
  'Position 5',
  'Position 6',
  'Position 7',
  'Position 8',
  'Position 9',
]

// Mock cards for demo
const mockCards: CardDetail[] = [
  {
    id: '1',
    userId: '1',
    player: 'Michael Jordan',
    year: 1986,
    set: 'Fleer',
    condition: 'near_mint',
    powerScore: 98,
    rarity: 'legendary',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: '1',
    player: 'LeBron James',
    year: 2003,
    set: 'Topps Chrome',
    condition: 'mint',
    powerScore: 95,
    rarity: 'epic',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: '1',
    player: 'Kobe Bryant',
    year: 1996,
    set: 'Topps',
    condition: 'excellent',
    powerScore: 89,
    rarity: 'rare',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    userId: '1',
    player: 'Stephen Curry',
    year: 2009,
    set: 'Panini Prizm',
    condition: 'near_mint',
    powerScore: 82,
    rarity: 'rare',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    userId: '1',
    player: 'Giannis Antetokounmpo',
    year: 2013,
    set: 'Hoops',
    condition: 'good',
    powerScore: 76,
    rarity: 'uncommon',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    userId: '1',
    player: 'Luka Doncic',
    year: 2018,
    set: 'Prizm',
    condition: 'mint',
    powerScore: 85,
    rarity: 'epic',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    userId: '1',
    player: 'Kevin Durant',
    year: 2007,
    set: 'Topps',
    condition: 'near_mint',
    powerScore: 88,
    rarity: 'rare',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    userId: '1',
    player: 'Tim Duncan',
    year: 1997,
    set: 'Fleer',
    condition: 'excellent',
    powerScore: 84,
    rarity: 'rare',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    userId: '1',
    player: 'Shaquille O\'Neal',
    year: 1992,
    set: 'Topps',
    condition: 'good',
    powerScore: 90,
    rarity: 'epic',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    userId: '1',
    player: 'Magic Johnson',
    year: 1980,
    set: 'Topps',
    condition: 'fair',
    powerScore: 78,
    rarity: 'uncommon',
    imageUrlFront: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

interface LineupSlot {
  position: number
  card: CardDetail | null
}

export default function LineupBuilderPage() {
  return (
    <Suspense fallback={<LineupPageSkeleton />}>
      <LineupBuilderContent />
    </Suspense>
  )
}

function LineupPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2.5/3.5] rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}

function LineupBuilderContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [lineupSlots, setLineupSlots] = useState<LineupSlot[]>(
    Array.from({ length: 9 }, (_, i) => ({ position: i + 1, card: null }))
  )
  const [activeCard, setActiveCard] = useState<CardDetail | null>(null)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [cardPickerOpen, setCardPickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  // Fetch user's cards
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user')
      try {
        const response = await cardApi.getUserCards(user.id, { limit: 100 })
        return response.data
      } catch {
        return { cards: mockCards, total: mockCards.length, page: 1, limit: 100, totalPages: 1 }
      }
    },
    enabled: !!user?.id,
  })

  // Fetch user's existing lineups
  const { data: existingLineups } = useQuery({
    queryKey: ['lineups', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user')
      try {
        const response = await lineupApi.getUserLineups(user.id)
        return response.data
      } catch {
        return []
      }
    },
    enabled: !!user?.id,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string
    const card = cardsData?.cards.find((c) => c.id === cardId) || 
                 lineupSlots.find((s) => s.card?.id === cardId)?.card
    if (card) setActiveCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropping on a lineup slot
    if (overId.startsWith('slot-')) {
      const position = parseInt(overId.replace('slot-', ''))
      const card = cardsData?.cards.find((c) => c.id === activeId)
      
      if (card) {
        // Check if card is already in lineup
        const existingSlot = lineupSlots.find((s) => s.card?.id === activeId)
        if (existingSlot) {
          // Move card from one slot to another
          setLineupSlots((prev) =>
            prev.map((slot) => {
              if (slot.position === existingSlot.position) return { ...slot, card: null }
              if (slot.position === position) return { ...slot, card }
              return slot
            })
          )
        } else {
          // Add new card to slot
          setLineupSlots((prev) =>
            prev.map((slot) =>
              slot.position === position ? { ...slot, card } : slot
            )
          )
        }
      }
    }
  }

  const removeFromLineup = (position: number) => {
    setLineupSlots((prev) =>
      prev.map((slot) =>
        slot.position === position ? { ...slot, card: null } : slot
      )
    )
  }

  const addCardToFirstEmptySlot = (card: CardDetail) => {
    const emptySlot = lineupSlots.find((s) => s.card === null)
    if (emptySlot) {
      setLineupSlots((prev) =>
        prev.map((slot) =>
          slot.position === emptySlot.position ? { ...slot, card } : slot
        )
      )
    }
  }

  const selectedCardIds = lineupSlots.filter((s) => s.card).map((s) => s.card!.id)
  const availableCards = cardsData?.cards.filter((c) => !selectedCardIds.includes(c.id)) || []
  const filteredAvailableCards = availableCards.filter((card) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      card.player.toLowerCase().includes(query) ||
      card.set.toLowerCase().includes(query)
    )
  })

  const totalPower = lineupSlots.reduce((sum, slot) => sum + (slot.card?.powerScore || 0), 0)
  const filledSlots = lineupSlots.filter((s) => s.card !== null).length
  const isLineupComplete = filledSlots === 9

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Build Lineup</h1>
            <p className="mt-1 text-muted-foreground">
              Select 9 cards for your battle lineup
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setLineupSlots(Array.from({ length: 9 }, (_, i) => ({ position: i + 1, card: null })))}
              disabled={filledSlots === 0}
            >
              Clear All
            </Button>
            <Button
              onClick={() => setSaveModalOpen(true)}
              disabled={!isLineupComplete}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Lineup
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Lineup Grid */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Lineup</h2>
                <div className="flex items-center gap-2">
                  <Badge variant={isLineupComplete ? 'default' : 'secondary'}>
                    {filledSlots}/9 Cards
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    {totalPower} Power
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <SortableContext
                  items={lineupSlots.map((s) => `slot-${s.position}`)}
                  strategy={rectSortingStrategy}
                >
                  {lineupSlots.map((slot) => (
                    <LineupSlotComponent
                      key={slot.position}
                      slot={slot}
                      onRemove={() => removeFromLineup(slot.position)}
                    />
                  ))}
                </SortableContext>
              </div>

              {/* Mobile card picker */}
              <Sheet open={cardPickerOpen} onOpenChange={setCardPickerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="mt-4 w-full gap-2 lg:hidden">
                    <Plus className="h-4 w-4" />
                    Browse Cards
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Select Cards</SheetTitle>
                    <SheetDescription>
                      Tap a card to add it to your lineup
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-4 overflow-y-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search cards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <CardGrid
                      cards={filteredAvailableCards}
                      selectable
                      selectedCardIds={selectedCardIds}
                      onSelectCard={(card) => {
                        addCardToFirstEmptySlot(card)
                        if (filledSlots >= 8) setCardPickerOpen(false)
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Card Picker (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <h2 className="text-lg font-semibold">Available Cards</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {cardsLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[2.5/3.5] rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card/50 p-3">
                    {filteredAvailableCards.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {availableCards.length === 0
                          ? 'All cards are in your lineup!'
                          : 'No cards match your search'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredAvailableCards.map((card) => (
                          <DraggableCard key={card.id} card={card} onAdd={() => addCardToFirstEmptySlot(card)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeCard && <CardOverlay card={activeCard} />}
          </DragOverlay>
        </DndContext>

        {/* Existing Lineups */}
        {existingLineups && existingLineups.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-xl font-semibold">Your Lineups</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {existingLineups.map((lineup) => (
                <LineupCard key={lineup.id} lineup={lineup} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Save Modal */}
      <SaveLineupModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        lineupSlots={lineupSlots}
        totalPower={totalPower}
        onSuccess={(lineupId) => {
          queryClient.invalidateQueries({ queryKey: ['lineups'] })
          router.push(`/lineup/${lineupId}`)
        }}
      />
    </div>
  )
}

function LineupSlotComponent({ slot, onRemove }: { slot: LineupSlot; onRemove: () => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `slot-${slot.position}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const rarity = slot.card ? (rarityConfig[slot.card.rarity] || rarityConfig.common) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative aspect-[2.5/3.5] rounded-lg border-2 border-dashed transition-colors',
        slot.card
          ? 'border-primary bg-card'
          : 'border-border bg-muted/20 hover:border-primary/50',
        isDragging && 'opacity-50'
      )}
      {...attributes}
      {...listeners}
    >
      {slot.card ? (
        <>
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {slot.card.imageUrlFront ? (
              <Image
                src={slot.card.imageUrlFront}
                alt={slot.card.player}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <span className="text-xl font-bold text-muted-foreground/50">
                  {slot.card.player.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Card info overlay */}
          <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-background/95 via-background/80 to-transparent p-2">
            <p className="truncate text-xs font-medium">{slot.card.player}</p>
            <div className="mt-1 flex items-center justify-between">
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', rarity?.className)}>
                {slot.card.powerScore}
              </Badge>
              <span className="text-[10px] text-muted-foreground">#{slot.position}</span>
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <Plus className="h-6 w-6" />
          <span className="text-xs">{POSITION_LABELS[slot.position - 1]}</span>
        </div>
      )}
    </div>
  )
}

function DraggableCard({ card, onAdd }: { card: CardDetail; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  const rarity = rarityConfig[card.rarity] || rarityConfig.common

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-[2.5/3.5] cursor-grab overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50',
        isDragging && 'opacity-50'
      )}
      onClick={onAdd}
      {...attributes}
      {...listeners}
    >
      {card.imageUrlFront ? (
        <Image src={card.imageUrlFront} alt={card.player} fill className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted">
          <span className="text-lg font-bold text-muted-foreground/50">
            {card.player.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2">
        <p className="truncate text-xs font-medium">{card.player}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', rarity.className)}>
            {card.powerScore}
          </Badge>
          <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </div>
  )
}

function CardOverlay({ card }: { card: CardDetail }) {
  return (
    <div className="aspect-[2.5/3.5] w-24 overflow-hidden rounded-lg border-2 border-primary bg-card shadow-xl">
      {card.imageUrlFront ? (
        <Image src={card.imageUrlFront} alt={card.player} fill className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted">
          <span className="text-lg font-bold text-muted-foreground/50">
            {card.player.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

function LineupCard({ lineup }: { lineup: Lineup }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{lineup.name}</h3>
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3 text-primary" />
          {lineup.totalPower}
        </Badge>
      </div>
      <div className="mt-3 flex -space-x-2">
        {lineup.cards.slice(0, 5).map((lc, i) => (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
          >
            {lc.card.player.slice(0, 2).toUpperCase()}
          </div>
        ))}
        {lineup.cards.length > 5 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
            +{lineup.cards.length - 5}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={`/lineup/${lineup.id}`}>View</a>
        </Button>
        <Button size="sm" className="flex-1 gap-1">
          <Swords className="h-3 w-3" />
          Battle
        </Button>
      </div>
    </div>
  )
}

function SaveLineupModal({
  open,
  onOpenChange,
  lineupSlots,
  totalPower,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lineupSlots: LineupSlot[]
  totalPower: number
  onSuccess: (lineupId: string) => void
}) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ name: string }>({
    defaultValues: { name: '' },
  })

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const cards = lineupSlots
        .filter((s) => s.card !== null)
        .map((s) => ({
          cardId: s.card!.id,
          position: s.position,
        }))

      const response = await lineupApi.create({ name, cards })
      return response.data
    },
    onSuccess: (data) => {
      reset()
      onOpenChange(false)
      onSuccess(data.id)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to save lineup')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Lineup</DialogTitle>
          <DialogDescription>
            Give your lineup a name and save it for battle
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit((data) => mutation.mutate(data.name))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lineup-name">Lineup Name</Label>
            <Input
              id="lineup-name"
              placeholder="My Championship Lineup"
              {...register('name', { required: 'Name is required' })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Power</span>
              <span className="flex items-center gap-1 font-semibold">
                <Zap className="h-4 w-4 text-primary" />
                {totalPower}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
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
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Lineup
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
