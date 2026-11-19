'use client'

import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatPriceCents } from '@/lib/catalog'
import type { PlacedItem } from '@/lib/layout/layout'

/** US-09: the items in the current layout, with the price each one adds. */
export function PlacedItemsList({
  items,
  onRemove,
}: {
  items: PlacedItem[]
  /** US-09 AT-4: when given, every row gets a remove button. */
  onRemove?: (id: string) => void
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items placed in this room yet.</p>
  }

  return (
    <ul aria-label="Placed items" className="grid gap-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
        >
          <div className="grid min-w-0 gap-0.5">
            <span className="truncate font-medium text-foreground">{item.name}</span>
            <span className="text-xs text-muted-foreground">
              {item.widthCm} × {item.depthCm} cm
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatPriceCents(item.priceCents)}
            </span>
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${item.name}`}
                title={`Remove ${item.name}`}
                onClick={() => onRemove(item.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
