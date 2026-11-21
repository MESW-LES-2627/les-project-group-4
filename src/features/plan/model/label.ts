import type { PlacedItem } from '@/features/plan/model/layout'

/** Label shown above a footprint. Selected items also show their size. */
export function itemLabelText(item: PlacedItem, selected = false): string {
  return selected
    ? `${item.name} · ${item.widthCm} × ${item.depthCm} cm`
    : item.name
}

/**
 * Room dimension in metres, with only the decimals that matter:
 * 300 -> "3 m", 90 -> "0.9 m", 245 -> "2.45 m".
 */
export function dimensionLabelText(cm: number): string {
  return `${Number((cm / 100).toFixed(2))} m`
}
