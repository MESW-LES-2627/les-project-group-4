import { describe, expect, it } from 'vitest'

import { findCollisions } from '@/features/plan/model/collision'

import { room, square } from './fixtures'

describe(
  'AT-3 — Touching: footprints that only share an edge do not collide',
  { tags: ['acceptance', 'US-11a', 'AT-3'] },
  () => {
    it('allows two items side by side (shared edge at x = 150)', () => {
      expect(findCollisions([square('a', 100, 100), square('b', 200, 100)], room).colliding).toEqual(
        [],
      )
    })

    it('allows two items that only share a corner', () => {
      expect(findCollisions([square('a', 100, 100), square('b', 200, 200)], room).colliding).toEqual(
        [],
      )
    })

    it('still reports a collision one millimetre past touching', () => {
      expect(findCollisions([square('a', 100, 100), square('b', 199.9, 100)], room).colliding).toEqual(
        ['a', 'b'],
      )
    })
  },
)
