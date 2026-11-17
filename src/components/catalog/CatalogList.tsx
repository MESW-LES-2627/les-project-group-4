import Link from 'next/link'
import type { ReactNode } from 'react'

import type { CatalogItem } from '@/api/types'
import { CATEGORY_LABELS, formatPriceCents } from '@/lib/catalog'
import type { ItemCategory } from '@/lib/catalog'
import { isItemCategory } from '@/lib/schemas/item'

/**
 * US-07: the catalog items as cards (name, category, footprint, price), or an empty state.
 * `category` is the selected filter, so the empty state can say what is empty.
 * US-09: `renderAction` adds a per-card control such as "Add to layout".
 */
export function CatalogList({
  items,
  category,
  renderAction,
}: {
  items: CatalogItem[]
  category: ItemCategory | undefined
  renderAction?: (item: CatalogItem) => ReactNode
}) {
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

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="grid gap-1 rounded-lg border border-border p-4">
          <span className="font-medium break-words text-foreground">{item.name}</span>
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