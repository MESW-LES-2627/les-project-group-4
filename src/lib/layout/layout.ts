/**
 * Shared layout-state contract for US-06a (#43), US-09 (#31), US-10 (#32) and US-12 (#34).
 */

import type { CatalogItem } from '@/api/types'
import type { Placement, Size } from '@/lib/geometry/plan'

/**
 * One item placed in the current room.
 */
export interface PlacedItem extends Size, Placement {
  id: string
  catalogItemId: number
  name: string
  /** Integer cents, matching the catalog: 34900 = 349,00 €. */
  priceCents: number
}

/**
 * US-09: a catalog item at a placement, with the price copied at the time it
 * was added. `id` is the instance, so the same catalog item can be added twice.
 */
export function toPlacedItem(
  item: CatalogItem,
  id: string,
  placement: Placement,
): PlacedItem {
  return {
    id,
    catalogItemId: item.id,
    name: item.name,
    widthCm: item.widthCm,
    depthCm: item.depthCm,
    priceCents: item.priceCents,
    ...placement,
  }
}

/**
 * The mutations the layout supports today. Move/rotate belong to US-10 (#32)
 */
export type LayoutAction =
  | { type: 'add'; item: PlacedItem }
  | { type: 'remove'; id: string }
  | { type: 'replace'; items: PlacedItem[] }

/** Turns an impossible branch into a compile error and a runtime error. */
function assertNever(value: never): never {
  throw new Error(`Unhandled layout action: ${JSON.stringify(value)}`)
}

/**
 * Pure reducer so the same layout logic works in a local hook, a context,
 * or a future store (#31). It never mutates the array it receives.
 */
export function layoutReducer(items: PlacedItem[], action: LayoutAction): PlacedItem[] {
  switch (action.type) {
    case 'add':
      return [...items, action.item]
    case 'remove':
      return items.filter((item) => item.id !== action.id)
    case 'replace':
      return action.items
    default:
      return assertNever(action)
  }
}
