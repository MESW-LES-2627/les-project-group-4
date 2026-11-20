import type { LayoutDetails, LayoutSummary, LayoutWithItems } from '@/api/types'
import { getDb } from '@/lib/db'
import type { CreateLayoutInput } from '@/lib/schemas/layout'

// The layout fields the API returns (see LayoutDetails in src/api/types.ts).
// Shared by the layouts routes so they all return the same shape.
const LAYOUT_DETAILS_SELECT = {
  id: true,
  roomId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      xCm: true,
      yCm: true,
      rotationDeg: true,
      priceCents: true,
      item: { select: { id: true, name: true, widthCm: true, depthCm: true } },
    },
    // Insertion order, so a reloaded layout lists its items in the order they were placed.
    orderBy: { id: 'asc' },
  },
} as const

type LayoutRow = {
  id: number
  roomId: number
  name: string
  createdAt: Date
  updatedAt: Date
  items: Array<{
    id: number
    xCm: number
    yCm: number
    rotationDeg: number
    priceCents: number
    item: { id: number; name: string; widthCm: number; depthCm: number }
  }>
}

/** Flattens the catalog item into each placed item, in the PlacedItem shape the plan uses. */
function toLayoutDetails(row: LayoutRow): LayoutDetails {
  return {
    id: row.id,
    roomId: row.roomId,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map(({ item, ...placed }) => ({
      id: placed.id,
      catalogItemId: item.id,
      name: item.name,
      widthCm: item.widthCm,
      depthCm: item.depthCm,
      priceCents: placed.priceCents,
      xCm: placed.xCm,
      yCm: placed.yCm,
      rotationDeg: placed.rotationDeg,
    })),
  }
}

/** True when a room with this id exists. Used to answer 404 before touching its layouts. */
export async function roomExists(id: number): Promise<boolean> {
  const room = await getDb().room.findUnique({ where: { id }, select: { id: true } })
  return room !== null
}

/** US-14 AT-1: the room's saved layouts, listed by name (id breaks ties, which the unique name makes rare). */
export async function findLayouts(roomId: number): Promise<LayoutSummary[]> {
  const layouts = await getDb().layout.findMany({
    where: { roomId },
    select: { id: true, name: true, updatedAt: true, _count: { select: { items: true } } },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
  return layouts.map((layout) => ({
    id: layout.id,
    name: layout.name,
    itemCount: layout._count.items,
    updatedAt: layout.updatedAt.toISOString(),
  }))
}

/**
 * US-14b: the room's saved layouts with their items, for the preview cards on
 * the room page. The list API keeps returning the lighter LayoutSummary shape.
 */
export async function findLayoutsWithItems(roomId: number): Promise<LayoutWithItems[]> {
  const layouts = await getDb().layout.findMany({
    where: { roomId },
    select: LAYOUT_DETAILS_SELECT,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
  return layouts.map((row) => {
    const details = toLayoutDetails(row)
    return {
      id: details.id,
      name: details.name,
      itemCount: details.items.length,
      updatedAt: details.updatedAt,
      items: details.items,
    }
  })
}

/** US-14 AT-2 / AT-5: one layout of this room with its items, or null if it does not exist in this room. */
export async function findLayout(roomId: number, layoutId: number): Promise<LayoutDetails | null> {
  const layout = await getDb().layout.findFirst({
    where: { id: layoutId, roomId },
    select: LAYOUT_DETAILS_SELECT,
  })
  return layout === null ? null : toLayoutDetails(layout)
}

/**
 * US-13: the catalog price of each item id that exists. Ids that are not in the map do not exist.
 * The price is copied into the saved layout, so the client never decides what an item costs.
 */
export async function findItemPrices(ids: readonly number[]): Promise<Map<number, number>> {
  if (ids.length === 0) return new Map()
  const items = await getDb().item.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, priceCents: true },
  })
  return new Map(items.map((item) => [item.id, item.priceCents]))
}

/**
 * US-13 AT-2: saves the layout and every placed item in one insert, so a failure leaves nothing half-saved (AT-5).
 * Throws Prisma's P2002 error when the room already has a layout with this name (AT-6).
 */
export async function createLayout(
  roomId: number,
  input: CreateLayoutInput,
  prices: ReadonlyMap<number, number>,
): Promise<LayoutDetails> {
  const layout = await getDb().layout.create({
    data: {
      roomId,
      name: input.name,
      items: {
        create: input.items.map((item) => ({
          itemId: item.catalogItemId,
          xCm: item.xCm,
          yCm: item.yCm,
          rotationDeg: item.rotationDeg,
          // findItemPrices has every id here: the route rejects unknown items first.
          priceCents: prices.get(item.catalogItemId) ?? 0,
        })),
      },
    },
    select: LAYOUT_DETAILS_SELECT,
  })
  return toLayoutDetails(layout)
}

/** US-14 AT-6: deletes the layout (its items go with it, ON DELETE CASCADE). False if it does not exist in this room. */
export async function deleteLayout(roomId: number, layoutId: number): Promise<boolean> {
  const { count } = await getDb().layout.deleteMany({ where: { id: layoutId, roomId } })
  return count > 0
}

/** True for Prisma's unique-constraint error (P2002), without importing the generated client. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  )
}
