import { describe, expect, it } from 'vitest'

import { findCollisions } from '@/features/plan/model/collision'
import { boundingBox } from '@/features/plan/model/geometry'
import { overlaps } from '@/features/plan/model/placement'

import { item, room, square } from './fixtures'

describe(
  'AT-4 — Rotated rectangles: rotation is taken into account (SAT)',
  { tags: ['acceptance', 'US-11a', 'AT-4'] },
  () => {
    it('detects an overlap that only exists once the item is rotated', () => {
      const table = square('table', 100, 100) // x 50..150, y 50..150
      // A 2 m × 10 cm shelf above the table: clear of it when straight...
      const straight = item('shelf', 200, 10, 220, 40, 0)
      expect(findCollisions([table, straight], room).colliding).toEqual([])

      // ...but turned 30° anticlockwise its left end dips into the table.
      const turned = item('shelf', 200, 10, 220, 40, -30)
      expect(findCollisions([table, turned], room).colliding).toEqual(['table', 'shelf'])
    })

    it('does not report rotated items whose bounding boxes overlap but whose shapes do not', () => {
      // Two 1 m squares at 45° (diamonds), 80 cm apart along both axes. Their
      // flat sides face each other with a gap, but their bounding boxes overlap.
      const a = square('a', 150, 150, 45)
      const b = square('b', 230, 230, 45)

      expect(overlaps(boundingBox(a, a), boundingBox(b, b))).toBe(true)
      expect(findCollisions([a, b], room).colliding).toEqual([])
    })

    it('separates a straight and a rotated square only on the rotated one\'s axis, in both orders', () => {
      // A straight 1 m square and a 1 m diamond: their bounding boxes overlap and
      // neither x nor y separates them, only the diamond's own edge direction does.
      const straight = square('straight', 100, 100)
      const diamond = square('diamond', 200, 200, 45)

      expect(overlaps(boundingBox(straight, straight), boundingBox(diamond, diamond))).toBe(true)
      expect(findCollisions([straight, diamond], room).colliding).toEqual([])
      expect(findCollisions([diamond, straight], room).colliding).toEqual([])
    })

    it('detects the same diamonds once they are moved closer', () => {
      const a = square('a', 150, 150, 45)
      const b = square('b', 200, 200, 45)

      expect(findCollisions([a, b], room).colliding).toEqual(['a', 'b'])
    })
  },
)
