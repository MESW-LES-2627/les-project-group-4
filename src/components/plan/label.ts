import type { PlacedItem } from '@/lib/layout/layout'

/** Label shown above a footprint. Selected items also show their size. */
export function itemLabelText(item: PlacedItem, selected = false): string {
  return selected
    ? `${item.name} · ${item.widthCm} × ${item.depthCm} cm`
    : item.name
}
