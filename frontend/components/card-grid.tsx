'use client'

import { type CardDetail, rarityConfig } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CardGridProps {
  cards: CardDetail[]
  onCardClick?: (card: CardDetail) => void
  selectable?: boolean
  selectedCardIds?: string[]
  onSelectCard?: (card: CardDetail) => void
}

export function CardGrid({
  cards,
  onCardClick,
  selectable = false,
  selectedCardIds = [],
  onSelectCard,
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-16">
        <div className="text-muted-foreground">No cards found</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Start by scanning your first card
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          onClick={() => {
            if (selectable && onSelectCard) {
              onSelectCard(card)
            } else if (onCardClick) {
              onCardClick(card)
            }
          }}
          selectable={selectable}
          selected={selectedCardIds.includes(card.id)}
        />
      ))}
    </div>
  )
}

interface CardTileProps {
  card: CardDetail
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
}

export function CardTile({ card, onClick, selectable = false, selected = false }: CardTileProps) {
  const rarity = rarityConfig[card.rarity] || rarityConfig.common
  
  const rarityGlowClass = {
    legendary: 'rarity-legendary',
    epic: 'rarity-epic',
    rare: 'rarity-rare',
    uncommon: 'rarity-uncommon',
    common: '',
  }[card.rarity] || ''

  const content = (
    <div
      className={cn(
        'card-shine group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200',
        'hover:border-primary/50 hover:shadow-lg',
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-primary border-primary',
        rarityGlowClass
      )}
      onClick={onClick}
    >
      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] overflow-hidden bg-muted">
        {card.imageUrlFront ? (
          <Image
            src={card.imageUrlFront}
            alt={`${card.player} ${card.year} ${card.set}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-2xl font-bold text-muted-foreground/50">
              {card.player.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Power Score Badge */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-bold backdrop-blur-sm">
          <Zap className="h-3 w-3 text-primary" />
          {card.powerScore}
        </div>

        {/* Selection indicator */}
        {selectable && (
          <div
            className={cn(
              'absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/50 bg-background/90'
            )}
          >
            {selected && (
              <svg className="h-3 w-3\" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-semibold leading-tight">{card.player}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {card.year} {card.set}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Badge variant="secondary" className={cn('text-xs', rarity.className)}>
            {rarity.label}
          </Badge>
        </div>
      </div>
    </div>
  )

  if (!selectable && !onClick) {
    return (
      <Link href={`/cards/${card.id}`}>
        {content}
      </Link>
    )
  }

  return content
}

// Re-export types for convenience
export type { CardDetail }
