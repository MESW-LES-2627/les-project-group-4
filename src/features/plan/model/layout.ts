/**
 * US-06a/US-09: one item placed in the current room. The draft reducer in
 * src/lib/layout/draft.ts owns add/remove/replace; move/rotate belong to US-10.
 */

import type { Placement, Size } from '@/features/plan/model/geometry'
import type { PlacedItemSource } from '@/features/plan/types'

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
  item: PlacedItemSource,
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
 * US-12: the running total of the layout, in integer cents. It adds the price
 * stored on each placed item (AT-6), never the current catalog price, so the
 * total of a layout does not change when the catalog does.
 */
export function totalPriceCents(items: readonly Pick<PlacedItem, 'priceCents'>[]): number {
  return items.reduce((sum, item) => sum + item.priceCents, 0)
}
