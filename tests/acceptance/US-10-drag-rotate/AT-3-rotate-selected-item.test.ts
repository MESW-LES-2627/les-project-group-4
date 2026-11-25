import { describe, expect, it } from 'vitest'

import type { RoomSize } from '@/features/plan/model/geometry'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/features/plan/model/draft'
import type { PlacedItem } from '@/features/plan/model/layout'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: PlacedItem = {
  id: 'sofa-1',
  catalogItemId: 12,
  name: 'Sofa',
  widthCm: 100,
  depthCm: 50,
  priceCents: 49900,
  xCm: 150,
  yCm: 100,
  rotationDeg: 0,
}

describe(
  'AT-3 — Rotate item: clicking a selected item on the plan rotates it 90°',
  { tags: ['acceptance', 'US-10', 'AT-3'] },
  () => {
    it('stores a 90° clockwise rotation for the selected item', () => {
      const state = {
        ...EMPTY_DRAFT_STATE,
        byRoom: { 1: [sofa] },
      }

      const next = draftReducer(state, {
        type: 'update-placement',
        roomId: 1,
        room,
        id: 'sofa-1',
        placement: { xCm: 150, yCm: 100, rotationDeg: 90 },
      })

      expect(next.byRoom[1]?.[0]).toMatchObject({
        xCm: 150,
        yCm: 100,
        rotationDeg: 90,
      })
    })
  },
)
