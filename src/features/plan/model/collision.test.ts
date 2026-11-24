import { describe, expect, it } from 'vitest'

import { findCollisions, footprintsOverlap } from './collision'
import type { CollisionItem } from './collision'
import type { RoomSize } from './geometry'

const room: RoomSize = { widthCm: 600, lengthCm: 400 }
const at = (xCm: number, yCm: number, rotationDeg = 0) => ({ xCm, yCm, rotationDeg })
const square = { widthCm: 100, depthCm: 100 }
const box = (id: string, xCm: number, yCm: number, rotationDeg = 0): CollisionItem => ({
  id,
  ...square,
  ...at(xCm, yCm, rotationDeg),
})

describe('footprintsOverlap', () => {
  it('is symmetric', () => {
    const a = { ...square, ...at(100, 100) }
    const b = { widthCm: 200, depthCm: 10, ...at(220, 40, -30) }

    expect(footprintsOverlap(a, b)).toBe(true)
    expect(footprintsOverlap(b, a)).toBe(true)
  })

  it('treats two identical footprints as overlapping', () => {
    const a = { ...square, ...at(100, 100, 45) }

    expect(footprintsOverlap(a, { ...a })).toBe(true)
  })

  it('treats 45° diamonds that touch along a flat side as not overlapping', () => {
    // Side 100 at 45°: the flat sides meet when the centres are 100/√2 apart on both axes.
    const d = 100 / Math.SQRT2
    const a = { ...square, ...at(150, 150, 45) }

    expect(footprintsOverlap(a, { ...square, ...at(150 + d, 150 + d, 45) })).toBe(false)
    expect(footprintsOverlap(a, { ...square, ...at(150 + d - 0.1, 150 + d - 0.1, 45) })).toBe(true)
  })

  it('gives the same answer for equivalent angles (90° vs -270°, 0° vs 360°)', () => {
    const a = { widthCm: 200, depthCm: 50, ...at(200, 200, 90) }
    const b = { ...square, ...at(250, 200) }

    expect(footprintsOverlap(a, b)).toBe(footprintsOverlap({ ...a, rotationDeg: -270 }, b))
    expect(footprintsOverlap(b, a)).toBe(footprintsOverlap({ ...b, rotationDeg: 360 }, a))
  })

  it('never reports a zero-size footprint', () => {
    const point = { widthCm: 0, depthCm: 0, ...at(100, 100) }

    expect(footprintsOverlap(point, { ...square, ...at(100, 100) })).toBe(false)
  })
})

describe('findCollisions', () => {
  it('returns empty lists for no items', () => {
    expect(findCollisions([], room)).toEqual({ colliding: [], outOfBounds: [] })
  })

  it('never reports a single item as colliding', () => {
    expect(findCollisions([box('a', 300, 200)], room).colliding).toEqual([])
  })

  it('reports each colliding item once, in input order, even with several overlaps', () => {
    const items = [box('c', 150, 100), box('a', 100, 100), box('b', 200, 100)]

    expect(findCollisions(items, room).colliding).toEqual(['c', 'a', 'b'])
  })

  it('reports two items placed exactly on top of each other', () => {
    expect(findCollisions([box('a', 300, 200), box('b', 300, 200)], room).colliding).toEqual([
      'a',
      'b',
    ])
  })
})
