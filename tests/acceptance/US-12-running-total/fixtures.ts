import type { CatalogItem } from '@/features/catalog/types'
import type { RoomSize } from '@/lib/geometry/plan'
import { EMPTY_DRAFT_STATE, draftReducer, type DraftState } from '@/lib/layout/draft'

/** A room big enough for every item below, side by side. */
export const room: RoomSize = { widthCm: 600, lengthCm: 500 }

export const sofa: CatalogItem = {
  id: 12,
  slug: 'sofa-nordic-3-seat',
  name: 'Nordic 3-seat sofa',
  category: 'sofa',
  widthCm: 200,
  depthCm: 90,
  heightCm: 80,
  priceCents: 49900,
  styleTags: ['nordic'],
  roomTypeTags: ['living-room'],
}

export const lamp: CatalogItem = {
  id: 7,
  slug: 'lamp-bedside',
  name: 'Bedside lamp',
  category: 'lighting',
  widthCm: 30,
  depthCm: 30,
  heightCm: 45,
  priceCents: 2900,
  styleTags: ['nordic'],
  roomTypeTags: ['bedroom'],
}

/**
 * The next free "item-N" id in room 1: one more than the highest N in use.
 * Unlike a position or a count, it never repeats, even after a remove, and it
 * stays deterministic (no random ids in tests).
 */
function nextItemId(state: DraftState): string {
  const used = (state.byRoom[1] ?? [])
    .map((item) => Number(item.id.replace(/^item-/, '')))
    .filter(Number.isInteger)
  return `item-${used.length === 0 ? 0 : Math.max(...used) + 1}`
}

/** Adds catalog items to room 1 one after the other, as the "Add" button does. */
export function addAll(items: CatalogItem[], state: DraftState = EMPTY_DRAFT_STATE): DraftState {
  return items.reduce(
    (current, item) =>
      draftReducer(current, { type: 'add', roomId: 1, room, id: nextItemId(current), item }),
    state,
  )
}
