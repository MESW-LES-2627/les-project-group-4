import { describe, expect, it } from 'vitest'

import { boundingBox, isInsideRoom } from '@/features/plan/model/geometry'
import type { Placement, RoomSize, Size } from '@/features/plan/model/geometry'

import { placeInRoom } from './placement'
import type { PlacedFootprint } from './placement'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

/** A footprint already in the room. */
function footprint(
  widthCm: number,
  depthCm: number,
  xCm: number,
  yCm: number,
  rotationDeg = 0,
): PlacedFootprint {
  return { widthCm, depthCm, xCm, yCm, rotationDeg }
}

/** placeInRoom, with the null case turned into a readable test failure. */
function place(
  size: Size,
  existing: ReadonlyArray<PlacedFootprint> = [],
  inside: RoomSize = room,
): Placement {
  const placement = placeInRoom(size, inside, existing)
  if (placement === null) {
    throw new Error(`expected ${size.widthCm}×${size.depthCm} cm to be placed`)
  }
  return placement
}

describe('placeInRoom', () => {
  it('places the first item flat against the top-left corner', () => {
    const placement = place({ widthCm: 100, depthCm: 50 })

    expect(placement).toEqual({ xCm: 50, yCm: 25, rotationDeg: 0 })
    expect(boundingBox({ widthCm: 100, depthCm: 50 }, placement)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 50,
    })
  })

  it('places the next item to the right of the previous one', () => {
    const placement = place({ widthCm: 80, depthCm: 50 }, [footprint(100, 50, 50, 25)])

    expect(placement).toEqual({ xCm: 140, yCm: 25, rotationDeg: 0 })
  })

  it('wraps to the next row when the top row is full', () => {
    const placement = place({ widthCm: 100, depthCm: 50 }, [
      footprint(100, 50, 50, 25),
      footprint(100, 50, 150, 25),
    ], { widthCm: 200, lengthCm: 200 })

    expect(placement).toEqual({ xCm: 50, yCm: 75, rotationDeg: 0 })
  })

  it('reuses a gap left in the top row', () => {
    // The 50 cm item was dragged to the right, leaving 200 cm of free wall.
    const placement = place({ widthCm: 50, depthCm: 50 }, [footprint(50, 50, 225, 25)])

    expect(placement).toEqual({ xCm: 25, yCm: 25, rotationDeg: 0 })
  })

  it('uses the free band beside a taller item before starting a new row', () => {
    const existing = [
      footprint(100, 100, 50, 50), // x 0..100, y 0..100
      footprint(100, 40, 150, 20), // x 100..200, y 0..40
    ]

    const placement = place({ widthCm: 100, depthCm: 40 }, existing, {
      widthCm: 200,
      lengthCm: 300,
    })

    expect(placement).toEqual({ xCm: 150, yCm: 60, rotationDeg: 0 })
  })

  it('starts a new row below the deepest item when nothing fits beside it', () => {
    const existing = [
      footprint(100, 100, 50, 50),
      footprint(100, 40, 150, 20),
    ]

    const placement = place({ widthCm: 200, depthCm: 40 }, existing, {
      widthCm: 200,
      lengthCm: 300,
    })

    expect(placement).toEqual({ xCm: 100, yCm: 120, rotationDeg: 0 })
  })

  it('allows an item to touch the wall and its neighbour', () => {
    const placement = place({ widthCm: 50, depthCm: 50 }, [footprint(50, 100, 25, 50)], {
      widthCm: 100,
      lengthCm: 100,
    })

    expect(placement).toEqual({ xCm: 75, yCm: 25, rotationDeg: 0 })
  })

  it('packs around a rotated item using its rotated bounds', () => {
    // 100×50 at 90° occupies 50×100 cm.
    const placement = place({ widthCm: 50, depthCm: 50 }, [footprint(100, 50, 25, 50, 90)], {
      widthCm: 100,
      lengthCm: 100,
    })

    expect(placement).toEqual({ xCm: 75, yCm: 25, rotationDeg: 0 })
  })

  it('still uses the top wall when every existing item has been moved down', () => {
    const placement = place({ widthCm: 100, depthCm: 50 }, [footprint(100, 50, 50, 100)])

    expect(placement).toEqual({ xCm: 50, yCm: 25, rotationDeg: 0 })
  })

  it('rotates an item that is too wide to fit upright', () => {
    // 200 cm along x does not fit a 120 cm wall, but 200 cm along y does.
    const placement = place({ widthCm: 200, depthCm: 100 }, [], {
      widthCm: 120,
      lengthCm: 210,
    })

    expect(placement).toEqual({ xCm: 50, yCm: 100, rotationDeg: 90 })
  })

  it('keeps rotation 0 when the item fits upright', () => {
    const placement = place({ widthCm: 200, depthCm: 100 }, [], {
      widthCm: 210,
      lengthCm: 210,
    })

    expect(placement).toEqual({ xCm: 100, yCm: 50, rotationDeg: 0 })
  })

  it('rotates into the next row instead of giving up', () => {
    const placement = place({ widthCm: 200, depthCm: 100 }, [footprint(150, 100, 75, 50)], {
      widthCm: 150,
      lengthCm: 300,
    })

    expect(placement).toEqual({ xCm: 50, yCm: 200, rotationDeg: 90 })
  })

  it('does not rotate when a later row fits upright', () => {
    const placement = place({ widthCm: 200, depthCm: 100 }, [footprint(200, 100, 100, 50)], {
      widthCm: 200,
      lengthCm: 300,
    })

    expect(placement).toEqual({ xCm: 100, yCm: 150, rotationDeg: 0 })
  })

  it('returns null when the item is too wide for the room in either rotation', () => {
    expect(
      placeInRoom({ widthCm: 250, depthCm: 60 }, { widthCm: 150, lengthCm: 200 }),
    ).toBeNull()
  })

  it('returns null when the item is too long for the room in either rotation', () => {
    expect(
      placeInRoom({ widthCm: 60, depthCm: 250 }, { widthCm: 200, lengthCm: 100 }),
    ).toBeNull()
  })

  it('returns null when the room is full', () => {
    expect(
      placeInRoom({ widthCm: 50, depthCm: 50 }, { widthCm: 100, lengthCm: 100 }, [
        footprint(100, 100, 50, 50),
      ]),
    ).toBeNull()
  })

  it('returns null for an item that fits neither way round', () => {
    // 200×100 in 150×150: 200 cm is longer than either side of the room.
    expect(
      placeInRoom({ widthCm: 200, depthCm: 100 }, { widthCm: 150, lengthCm: 150 }),
    ).toBeNull()
  })

  it('keeps filling the room without overlaps', () => {
    const items: PlacedFootprint[] = []
    const size: Size = { widthCm: 40, depthCm: 40 }

    for (let index = 0; index < 10; index += 1) {
      const placement = place(size, items)
      expect(isInsideRoom(size, placement, room)).toBe(true)
      items.push({ ...size, ...placement })
    }

    expect(new Set(items.map((item) => `${item.xCm},${item.yCm}`)).size).toBe(items.length)
  })

  it('does not change the layout it is given', () => {
    const existing = [footprint(100, 50, 50, 25)]
    const before = structuredClone(existing)

    place({ widthCm: 80, depthCm: 50 }, existing)

    expect(existing).toEqual(before)
  })
})
