import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import type { RoomSize } from '@/features/plan/model/geometry'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/features/plan/model/draft'
import { DOES_NOT_FIT_MESSAGE } from '@/features/plan/model/placement'

const smallRoom: RoomSize = { widthCm: 100, lengthCm: 100 }

const wardrobe: CatalogItem = {
  id: 14,
  slug: 'wardrobe-oak',
  name: 'Oak wardrobe',
  category: 'storage',
  widthCm: 200,
  depthCm: 100,
  heightCm: 200,
  priceCents: 45900,
  styleTags: ['nordic'],
  roomTypeTags: ['bedroom'],
}

describe(
  'AT-5 — Doesn’t fit: an item larger than the room is not added and is reported',
  { tags: ['acceptance', 'US-09a', 'AT-5'] },
  () => {
    it('leaves the layout unchanged and keeps the message for the room', () => {
      // 200×100 in a 100×100 room fits neither upright nor rotated.
      const state = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room: smallRoom,
        id: 'wardrobe-1',
        item: wardrobe,
      })

      expect(state.byRoom[1]).toBeUndefined()
      expect(DOES_NOT_FIT_MESSAGE).toBe("Doesn't fit this room")
      expect(state.error).toEqual({ roomId: 1, message: DOES_NOT_FIT_MESSAGE })
    })

    it('clears the message once the same room fits an item', () => {
      const failed = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room: smallRoom,
        id: 'wardrobe-1',
        item: wardrobe,
      })
      const lamp: CatalogItem = { ...wardrobe, id: 15, slug: 'lamp', widthCm: 40, depthCm: 40 }

      const next = draftReducer(failed, {
        type: 'add',
        roomId: 1,
        room: smallRoom,
        id: 'lamp-1',
        item: lamp,
      })

      expect(next.error).toBeNull()
      expect(next.byRoom[1]).toHaveLength(1)
    })
  },
)
