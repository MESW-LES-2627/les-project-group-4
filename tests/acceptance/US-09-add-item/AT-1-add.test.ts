import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import { isInsideRoom } from '@/lib/geometry/plan'
import type { RoomSize } from '@/lib/geometry/plan'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/lib/layout/draft'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: CatalogItem = {
  id: 12,
  slug: 'sofa-nordic-3-seat',
  name: 'Nordic 3-seat sofa',
  category: 'sofa',
  widthCm: 200,
  depthCm: 100,
  heightCm: 80,
  priceCents: 49900,
  styleTags: ['nordic'],
  roomTypeTags: ['living-room'],
}

describe(
  'AT-1 — Add item: adding a catalog item puts it in the current layout',
  { tags: ['acceptance', 'US-09a', 'AT-1'] },
  () => {
    it('adds the catalog item to the room draft at a placement inside the room', () => {
      const state = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'sofa-1',
        item: sofa,
      })
      const items = state.byRoom[1] ?? []
      const placed = items.at(0)

      expect(items).toHaveLength(1)
      expect(placed).toEqual({
        id: 'sofa-1',
        catalogItemId: 12,
        name: 'Nordic 3-seat sofa',
        widthCm: 200,
        depthCm: 100,
        priceCents: 49900,
        xCm: 100,
        yCm: 50,
        rotationDeg: 0,
      })
      expect(placed && isInsideRoom(placed, placed, room)).toBe(true)
      expect(state.error).toBeNull()
    })

    // The plan renders exactly this list (Plan2D's `items`), so the second half
    // of AT-1 is AT-3's renderer test.
    it('keeps the other rooms untouched', () => {
      const firstRoom = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'sofa-1',
        item: sofa,
      })
      const secondRoom = draftReducer(firstRoom, {
        type: 'add',
        roomId: 2,
        room,
        id: 'sofa-2',
        item: sofa,
      })

      expect(secondRoom.byRoom[1]).toHaveLength(1)
      expect(secondRoom.byRoom[2]).toHaveLength(1)
    })
  },
)
