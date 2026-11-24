import { describe, expect, it } from 'vitest'

import { findCollisions } from '@/features/plan/model/collision'

import { room, square } from './fixtures'

describe(
  'AT-5 — Out of bounds: a footprint outside the room is reported',
  { tags: ['acceptance', 'US-11a', 'AT-5'] },
  () => {
    it('reports an item that is partly outside the room', () => {
      // x -10..90: 10 cm past the left wall.
      expect(findCollisions([square('a', 40, 200)], room).outOfBounds).toEqual(['a'])
    })

    it('reports an item that is fully outside the room', () => {
      expect(findCollisions([square('a', 800, 200)], room).outOfBounds).toEqual(['a'])
    })

    it('reports a rotated item whose corner sticks out past a wall', () => {
      // Straight, a square at x = 60 fits (x 10..110); at 45° its corner reaches x ≈ -10.7.
      expect(findCollisions([square('a', 60, 200, 0)], room).outOfBounds).toEqual([])
      expect(findCollisions([square('a', 60, 200, 45)], room).outOfBounds).toEqual(['a'])
    })

    it('keeps items against a wall inside the room', () => {
      const corner = square('corner', 50, 50) // touches the top and left walls
      const far = square('far', 550, 350) // touches the bottom and right walls

      expect(findCollisions([corner, far], room).outOfBounds).toEqual([])
    })

    it('reports bounds and overlaps independently', () => {
      const report = findCollisions([square('a', 40, 200), square('b', 100, 200)], room)

      expect(report).toEqual({ colliding: ['a', 'b'], outOfBounds: ['a'] })
    })
  },
)
