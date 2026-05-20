'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import { cardApi, type ListCardsQueryDto, type CardDetail } from '@/lib/api/client'
import { Header } from '@/components/header'
import { CardGrid } from '@/components/card-grid'
import { ScanUploadModal } from '@/components/scan-upload-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'

const RARITY_OPTIONS = [
  { value: 'all', label: 'All Rarities' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'epic', label: 'Epic' },
  { value: 'rare', label: 'Rare' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'common', label: 'Common' },
]

const SORT_OPTIONS = [
  { value: 'powerScore-desc', label: 'Power (High to Low)' },
  { value: 'powerScore-asc', label: 'Power (Low to High)' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'player-asc', label: 'Player (A-Z)' },
  { value: 'year-desc', label: 'Year (Newest)' },
]

// Mock data for demo
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
]

export default function CollectionPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ListCardsQueryDto>({
    page: 1,
    limit: 24,
    sortBy: 'powerScore',
    sortOrder: 'desc',
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['cards', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user')
      try {
        const response = await cardApi.getUserCards(user.id, filters)
        return response.data
      } catch {
        // Return mock data for demo when API is unavailable
        return {
          cards: mockCards,
          total: mockCards.length,
          page: 1,
          limit: 24,
          totalPages: 1,
        }
      }
    },
    enabled: !!user?.id,
  })

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc']
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }))
  }

  const handleRarityChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      rarity: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 24,
      sortBy: 'powerScore',
      sortOrder: 'desc',
    })
    setSearchQuery('')
  }

  const filteredCards = data?.cards?.filter((card) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      card.player.toLowerCase().includes(query) ||
      card.set.toLowerCase().includes(query) ||
      card.year.toString().includes(query)
    )
  })

  const hasActiveFilters = filters.rarity || searchQuery

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Collection</h1>
            <p className="mt-1 text-muted-foreground">
              {data?.total ?? 0} cards in your collection
            </p>
          </div>
          <Button onClick={() => setScanModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Card
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by player, set, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden items-center gap-2 md:flex">
            <Select
              value={filters.rarity || 'all'}
              onValueChange={handleRarityChange}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                {RARITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Mobile Filters Button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 md:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>Filter & Sort</SheetTitle>
                <SheetDescription>
                  Customize how your collection is displayed
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select
                    value={filters.rarity || 'all'}
                    onValueChange={handleRarityChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      {RARITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearFilters()
                      setFiltersOpen(false)
                    }}
                  >
                    Clear
                  </Button>
                  <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Card Grid */}
        {isLoading || authLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2.5/3.5] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <p className="text-destructive">Failed to load cards</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <CardGrid cards={filteredCards || []} />
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
              }
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {filters.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={filters.page === data.totalPages}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
              }
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Scan Modal */}
      <ScanUploadModal open={scanModalOpen} onOpenChange={setScanModalOpen} />
    </div>
  )
}
