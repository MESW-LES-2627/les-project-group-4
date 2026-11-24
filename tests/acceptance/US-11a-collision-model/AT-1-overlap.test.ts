import { describe, expect, it } from 'vitest'

import { findCollisions } from '@/features/plan/model/collision'

import { item, room, square } from './fixtures'

describe(
  'AT-1 — Overlap: two overlapping footprints are both reported as colliding',
  { tags: ['acceptance', 'US-11a', 'AT-1'] },
  () => {
    it('reports both items when their footprints share area', () => {
      // x 50..150 and x 120..220: 30 cm of overlap.
      const report = findCollisions([square('a', 100, 100), square('b', 170, 100)], room)

      expect(report.colliding).toEqual(['a', 'b'])
    })

    it('reports an item that sits entirely on top of a bigger one', () => {
      const rug = item('rug', 300, 200, 300, 200)
      const table = square('table', 300, 200)

      expect(findCollisions([rug, table], room).colliding).toEqual(['rug', 'table'])
    })

    it('only reports the items involved, not the rest of the room', () => {
      const report = findCollisions(
        [square('a', 100, 100), square('b', 170, 100), square('c', 450, 300)],
        room,
      )

      expect(report.colliding).toEqual(['a', 'b'])
    })
  },
)
