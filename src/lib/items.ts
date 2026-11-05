import type { CatalogItem } from '@/api/types'
import { getDb } from '@/lib/db'
import type { ItemCategory } from '@/lib/catalog'

// The item fields the API returns (see CatalogItem in src/api/types.ts).
// Shared by the items route and the catalog page so they return the same shape.
export const ITEM_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  widthCm: true,
  depthCm: true,
  heightCm: true,
  priceCents: true,
  styleTags: true,
  roomTypeTags: true,
} as const

/** US-07: catalog items, optionally of one category, sorted by category then name. */
export function findItems(category?: ItemCategory): Promise<CatalogItem[]> {
  return getDb().item.findMany({
    where: category === undefined ? undefined : { category },
    select: ITEM_SELECT,
    // id breaks ties between items with the same name.
    orderBy: [{ category: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  })
}