'use client'

import Link from 'next/link'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

import type { CatalogItem } from '@/api/types'
import { CATEGORY_LABELS, formatPriceCents } from '@/lib/catalog'
import type { ItemCategory } from '@/lib/catalog'
import { isItemCategory } from '@/lib/schemas/item'

/**
 * US-07: the catalog items as cards (name, category, footprint, price), or an empty state.
 * `category` is the selected filter, so the empty state can say what is empty.
 * US-08: `filtered` is true when price or tag filters are set; then the empty state says that
 * nothing matches the filters and offers `onClearFilters`.
 * US-09: `renderAction` adds a per-card control such as "Add to layout".
 */
export function CatalogList({
  items,
  category,
  filtered = false,
  onClearFilters,
  renderAction,
  onItemDragStart,
  layout = 'grid',
}: {
  items: CatalogItem[]
  category: ItemCategory | undefined
  filtered?: boolean
  onClearFilters?: () => void
  renderAction?: (item: CatalogItem) => ReactNode
  onItemDragStart?: (item: CatalogItem, event: React.DragEvent<HTMLLIElement>) => void
  layout?: 'grid' | 'list'
}) {
  if (items.length === 0 && filtered) {
    return (
      <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border p-6">
        <p className="text-sm text-muted-foreground">No items match these filters.</p>
        {/* A button, not a link: the filters live in client state (see CatalogBrowser). */}
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm font-medium text-foreground underline"
        >
          Clear filters
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border p-6">
        {category === undefined ? (
          <p className="text-sm text-muted-foreground">The catalog has no items yet.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              There are no {CATEGORY_LABELS[category].toLowerCase()} in the catalog yet.
            </p>
            <Link href="/catalog" className="text-sm font-medium text-foreground underline">
              Show all items
            </Link>
          </>
        )}
      </div>
    )
  }

  const listClass =
    layout === 'list'
      ? 'grid gap-3'
      : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <ul className={listClass}>
      {items.map((item) => (
        <li
          key={item.id}
          draggable={onItemDragStart !== undefined}
          onDragStart={(event) => onItemDragStart?.(item, event)}
          className="grid gap-1 rounded-lg border border-border p-3 transition-colors hover:border-muted-foreground/50 [&[draggable='true']]:cursor-grab [&[draggable='true']]:active:cursor-grabbing"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="font-medium break-words text-foreground">{item.name}</span>
            {onItemDragStart ? (
              <GripVertical
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            ) : null}
          </span>
          <span className="text-xs text-muted-foreground">
            {isItemCategory(item.category) ? CATEGORY_LABELS[item.category] : item.category}
          </span>
          <span className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {item.widthCm} × {item.depthCm} cm
            </span>
            <span className="font-semibold text-foreground">
              {formatPriceCents(item.priceCents)}
            </span>
          </span>
          {renderAction ? (
            <div className="flex justify-end pt-1">{renderAction(item)}</div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
