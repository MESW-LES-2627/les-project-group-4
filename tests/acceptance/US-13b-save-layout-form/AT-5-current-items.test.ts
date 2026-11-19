import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/api/types'
import { draftReducer, EMPTY_DRAFT_STATE } from '@/lib/layout/draft'
import { toSaveLayoutRequest } from '@/lib/saveLayout'

const room = { widthCm: 400, lengthCm: 300 }

function catalogItem(id: number, widthCm: number, depthCm: number): CatalogItem {
  return {
    id,
    slug: `item-${id}`,
    name: `Item ${id}`,
    category: 'sofa',
    widthCm,
    depthCm,
    heightCm: null,
    priceCents: 10000,
    styleTags: [],
    roomTypeTags: [],
  }
}

// The form reads itemsFor(room.id) from the draft (RoomPlan); this checks that the
// items on the plan are exactly the ones sent.
describe(
  'AT-5 — Current items: saving sends exactly the items on the plan',
  { tags: ['acceptance', 'US-13b', 'AT-5'] },
  () => {
    it('sends each placed item with its x, y and rotation', () => {
      let state = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'a',
        item: catalogItem(3, 200, 90),
      })
      state = draftReducer(state, { type: 'add', roomId: 1, room, id: 'b', item: catalogItem(8, 80, 30) })
      const items = state.byRoom[1] ?? []

      const result = toSaveLayoutRequest('Cosy corner', items)

      expect(result).toEqual({
        ok: true,
        request: {
          name: 'Cosy corner',
          items: items.map(({ catalogItemId, xCm, yCm, rotationDeg }) => ({
            catalogItemId,
            xCm,
            yCm,
            rotationDeg,
          })),
        },
      })
      expect(items).toHaveLength(2)
    })

    it('does not send items that were removed from the plan', () => {
      let state = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'a',
        item: catalogItem(3, 200, 90),
      })
      state = draftReducer(state, { type: 'remove', roomId: 1, id: 'a' })

      const result = toSaveLayoutRequest('Empty', state.byRoom[1] ?? [])

      expect(result).toEqual({ ok: true, request: { name: 'Empty', items: [] } })
    })
  },
)
