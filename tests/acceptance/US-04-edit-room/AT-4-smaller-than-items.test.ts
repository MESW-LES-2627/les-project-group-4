import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/features/plan/model/layout'
import { describeItemsOutside, itemsOutsideRoom } from '@/features/rooms/model/roomEdit'

const item = (overrides: Partial<PlacedItem>): PlacedItem => ({
  id: 'a',
  catalogItemId: 1,
  name: 'Sofa',
  widthCm: 200,
  depthCm: 90,
  priceCents: 49900,
  xCm: 100,
  yCm: 45,
  rotationDeg: 0,
  ...overrides,
})

// The rule behind the warning: which placed items no longer fit in the new dimensions.
describe(
  'AT-4 — Smaller-than-items warning: which placed items the new dimensions leave outside',
  { tags: ['acceptance', 'US-04', 'AT-4'] },
  () => {
    it('finds an item wider than the new width', () => {
      const sofa = item({})
      expect(itemsOutsideRoom([sofa], { widthCm: 150, lengthCm: 400 })).toEqual([sofa])
    })

    it('finds an item that fits in size but now sits past the new length', () => {
      const lamp = item({ id: 'lamp', name: 'Lamp', widthCm: 30, depthCm: 30, xCm: 50, yCm: 380 })
      expect(itemsOutsideRoom([lamp], { widthCm: 300, lengthCm: 300 })).toEqual([lamp])
    })

    it('uses the rotated footprint', () => {
      // Turned 90°, the 200 × 90 sofa needs 200 cm of length, not of width.
      const turned = item({ xCm: 45, yCm: 100, rotationDeg: 90 })
      expect(itemsOutsideRoom([turned], { widthCm: 100, lengthCm: 400 })).toEqual([])
      expect(itemsOutsideRoom([turned], { widthCm: 100, lengthCm: 150 })).toEqual([turned])
    })

    it('finds nothing when every item still fits, including one touching the wall', () => {
      expect(itemsOutsideRoom([item({})], { widthCm: 200, lengthCm: 90 })).toEqual([])
    })

    it('names the items in the warning', () => {
      expect(describeItemsOutside([item({})])).toBe(
        '1 placed item would be outside the room with these dimensions (Sofa).',
      )
      expect(
        describeItemsOutside([
          item({ name: 'Sofa' }),
          item({ name: 'Lamp' }),
          item({ name: 'Rug' }),
          item({ name: 'Desk' }),
          item({ name: 'Lamp' }),
        ]),
      ).toBe('5 placed items would be outside the room with these dimensions (Sofa, Lamp, Rug and 1 more).')
    })
  },
)
