import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/features/plan/model/layout'
import { describeItemsOutside, findItemsOutside } from '@/features/rooms/model/roomEdit'

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

const noLayouts: { name: string; items: PlacedItem[] }[] = []

// The rule behind the warning: which placed items no longer fit in the new dimensions.
describe(
  'AT-4 — Smaller-than-items warning: which placed items the new dimensions leave outside',
  { tags: ['acceptance', 'US-04', 'AT-4'] },
  () => {
    it('finds an item wider than the new width', () => {
      expect(findItemsOutside([item({})], noLayouts, { widthCm: 150, lengthCm: 400 }).placed).toEqual([
        'Sofa',
      ])
    })

    it('finds an item that fits in size but now sits past the new length', () => {
      const lamp = item({ name: 'Lamp', widthCm: 30, depthCm: 30, xCm: 50, yCm: 380 })
      expect(findItemsOutside([lamp], noLayouts, { widthCm: 300, lengthCm: 300 }).placed).toEqual([
        'Lamp',
      ])
    })

    it('uses the rotated footprint', () => {
      // Turned 90°, the 200 × 90 sofa needs 200 cm of length, not of width.
      const turned = item({ xCm: 45, yCm: 100, rotationDeg: 90 })
      expect(findItemsOutside([turned], noLayouts, { widthCm: 100, lengthCm: 400 }).placed).toEqual([])
      expect(findItemsOutside([turned], noLayouts, { widthCm: 100, lengthCm: 150 }).placed).toEqual([
        'Sofa',
      ])
    })

    it('finds nothing when every item still fits, including one touching the wall', () => {
      expect(findItemsOutside([item({})], noLayouts, { widthCm: 200, lengthCm: 90 })).toEqual({
        placed: [],
        layouts: [],
      })
    })

    it('also finds saved layouts with an item that would be outside', () => {
      const layouts = [
        { name: 'Cosy corner', items: [item({ xCm: 250 })] },
        { name: 'Reading nook', items: [item({})] },
      ]
      expect(findItemsOutside([], layouts, { widthCm: 300, lengthCm: 400 }).layouts).toEqual([
        'Cosy corner',
      ])
    })

    it('names the items and the layouts in the warning', () => {
      expect(describeItemsOutside({ placed: ['Sofa'], layouts: [] })).toEqual([
        '1 placed item would be outside the room (Sofa).',
      ])
      expect(
        describeItemsOutside({
          placed: ['Sofa', 'Lamp', 'Rug', 'Desk', 'Lamp'],
          layouts: ['Cosy corner'],
        }),
      ).toEqual([
        '5 placed items would be outside the room (Sofa, Lamp, Rug and 1 more).',
        '1 saved layout has items that would be outside (Cosy corner).',
      ])
    })
  },
)
