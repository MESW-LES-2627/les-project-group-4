import { formatPriceCents } from '@/lib/catalog'
import type { PlacedItem } from '@/lib/layout/layout'

/** US-09: the items in the current layout, with the price each one adds. */
export function PlacedItemsList({ items }: { items: PlacedItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items placed in this room yet.</p>
  }

  return (
    <ul aria-label="Placed items" className="grid gap-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2"
        >
          <span className="font-medium break-words text-foreground">{item.name}</span>
          <span className="text-xs text-muted-foreground">
            {item.widthCm} × {item.depthCm} cm
          </span>
          <span className="text-sm font-semibold text-foreground">
            {formatPriceCents(item.priceCents)}
          </span>
        </li>
      ))}
    </ul>
  )
}
