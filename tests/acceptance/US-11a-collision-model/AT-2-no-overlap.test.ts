import { describe, expect, it } from 'vitest'

import { findCollisions } from '@/features/plan/model/collision'

import { room, square } from './fixtures'

describe(
  'AT-2 — No overlap: separate footprints are not reported',
  { tags: ['acceptance', 'US-11a', 'AT-2'] },
  () => {
    it('reports nothing for items with a gap between them', () => {
      const report = findCollisions(
        [square('a', 100, 100), square('b', 300, 100), square('c', 100, 300)],
        room,
      )

      expect(report).toEqual({ colliding: [], outOfBounds: [] })
    })

    it('reports nothing for an empty room or a single item', () => {
      expect(findCollisions([], room)).toEqual({ colliding: [], outOfBounds: [] })
      expect(findCollisions([square('a', 300, 200)], room).colliding).toEqual([])
    })
  },
)
