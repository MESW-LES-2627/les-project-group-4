import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import type { RoomSize } from '@/features/plan/model/geometry'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/features/plan/model/draft'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: CatalogItem = {
  id: 12,
  slug: 'sofa-nordic-3-seat',
  name: 'Nordic 3-seat sofa',
  category: 'sofa',
  widthCm: 100,
  depthCm: 50,
  heightCm: 80,
  priceCents: 49900,
  styleTags: ['nordic'],
  roomTypeTags: ['living-room'],
}

/**
 * The reducer drives the plan and the "Placed items" panel, so an immediate
 * state change is what the user sees. The live-region announcement needs a
 * browser/DOM harness (CH-05, #66) and is covered manually.
 */
describe(
  'AT-3 — Add and remove feedback: the draft changes immediately',
  { tags: ['acceptance', 'US-09b', 'AT-3'] },
  () => {
    it('adds the item to the room draft immediately', () => {
      const state = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'sofa-1',
        item: sofa,
      })

      expect(state.byRoom[1]).toHaveLength(1)
      expect(state.byRoom[1]?.[0]?.name).toBe('Nordic 3-seat sofa')
      expect(state.error).toBeNull()
    })

    it('removes the item from the room draft immediately', () => {
      const added = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'sofa-1',
        item: sofa,
      })

      const removed = draftReducer(added, { type: 'remove', roomId: 1, id: 'sofa-1' })

      expect(removed.byRoom[1]).toEqual([])
      expect(removed.error).toBeNull()
    })
  },
)
