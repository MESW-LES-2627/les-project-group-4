import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { getDb } from '@/lib/db'

import type { ListItemsQuery } from '../schema'
import type { CatalogItem } from '../types'

// The item fields the API returns (see CatalogItem in features/catalog/types.ts).
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

/**
 * US-08: the Prisma filter for a catalog query. Keys are ANDed (AND across facets);
 * hasSome matches any of the selected tags (OR within a facet); lte keeps the maximum price.
 * No filter at all gives undefined, so the unfiltered query is exactly the US-07 one.
 */
export function itemsWhere(query: ListItemsQuery): Prisma.ItemWhereInput | undefined {
  const where: Prisma.ItemWhereInput = {}
  if (query.category !== undefined) where.category = query.category
  if (query.maxPriceCents !== undefined) where.priceCents = { lte: query.maxPriceCents }
  if (query.style !== undefined) where.styleTags = { hasSome: query.style }
  if (query.room !== undefined) where.roomTypeTags = { hasSome: query.room }
  return Object.keys(where).length === 0 ? undefined : where
}

/** US-07/US-08: catalog items matching the query, sorted by category then name. */
export function findItems(query: ListItemsQuery = {}): Promise<CatalogItem[]> {
  return getDb().item.findMany({
    where: itemsWhere(query),
    select: ITEM_SELECT,
    // id breaks ties between items with the same name.
    orderBy: [{ category: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  })
}

/** US-08: every style and room-type tag used in the catalog, sorted, for the filter options. */
export async function findTagOptions(): Promise<{ style: string[]; room: string[] }> {
  const rows = await getDb().item.findMany({ select: { styleTags: true, roomTypeTags: true } })
  const sorted = (tags: string[]) => [...new Set(tags)].sort()
  return {
    style: sorted(rows.flatMap((row) => row.styleTags)),
    room: sorted(rows.flatMap((row) => row.roomTypeTags)),
  }
}
