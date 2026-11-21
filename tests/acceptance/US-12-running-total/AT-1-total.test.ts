import { describe, expect, it } from 'vitest'

import { EMPTY_DRAFT_STATE, draftReducer } from '@/features/plan/model/draft'
import { totalPriceCents, toPlacedItem } from '@/features/plan/model/layout'

import { lamp, sofa } from './fixtures'

describe(
  'AT-1 — Total: with two placed items, the total is the sum of their stored prices',
  { tags: ['acceptance', 'US-12', 'AT-1'] },
  () => {
    it('sums the two items of a layout that is loaded into the room', () => {
      // A loaded layout replaces the room's items in one go ('replace').
      const loaded = [
        toPlacedItem(sofa, 'a', { xCm: 150, yCm: 100, rotationDeg: 0 }),
        toPlacedItem(lamp, 'b', { xCm: 400, yCm: 100, rotationDeg: 0 }),
      ]
      const state = draftReducer(EMPTY_DRAFT_STATE, { type: 'replace', roomId: 1, items: loaded })

      expect(totalPriceCents(state.byRoom[1] ?? [])).toBe(49900 + 2900)
    })

    it('is 0 for a room with no items', () => {
      expect(totalPriceCents([])).toBe(0)
    })
  },
)
