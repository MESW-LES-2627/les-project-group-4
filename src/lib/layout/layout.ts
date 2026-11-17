/**
 * US-06a/US-09: one item placed in the current room. The draft reducer in
 * src/lib/layout/draft.ts owns add/remove/replace; move/rotate belong to US-10.
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
