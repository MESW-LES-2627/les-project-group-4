import { describe, expect, it } from 'vitest'

import {
  boundingBox,
  findFittingRotation,
  footprintCorners,
  isInsideRoom,
  normalizeRotation,
  roomOutline,
  sizeToScene,
  toScene,
} from './plan'

const sofa = { widthCm: 200, depthCm: 100 }
const room = { widthCm: 400, lengthCm: 300 }
const at = (xCm: number, yCm: number, rotationDeg = 0) => ({ xCm, yCm, rotationDeg })

describe('normalizeRotation', () => {
  it.each([
    [0, 0],
    [90, 90],
    [360, 0],
    [450, 90],
    [-90, 270],
    [-450, 270],
  ])('%d° -> %d°', (input, expected) => {
    expect(normalizeRotation(input)).toBe(expected)
  })
})

describe('footprintCorners', () => {
  it('unrotated: true-to-scale rectangle around the centre', () => {
    expect(footprintCorners(sofa, at(200, 150))).toEqual([
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 200 },
      { x: 100, y: 200 },
    ])
  })

  it('90° clockwise (y down): the top-left corner moves to the top-right', () => {
    const [first] = footprintCorners(sofa, at(0, 0, 90))
    expect(first.x).toBeCloseTo(50) // was (-100, -50)
    expect(first.y).toBeCloseTo(-100)
  })
})

describe('boundingBox', () => {
  it('90° swaps width and depth', () => {
    const box = boundingBox(sofa, at(200, 150, 90))
    expect(box.maxX - box.minX).toBeCloseTo(100)
    expect(box.maxY - box.minY).toBeCloseTo(200)
  })

  it('180° and 360° give the same box as 0°', () => {
    const base = boundingBox(sofa, at(200, 150))
    for (const deg of [180, 360, -180]) {
      const box = boundingBox(sofa, at(200, 150, deg))
      expect(box.minX).toBeCloseTo(base.minX)
      expect(box.maxY).toBeCloseTo(base.maxY)
    }
  })

  it('45° grows the box to (w + d) / √2 on both axes', () => {
    const box = boundingBox(sofa, at(0, 0, 45))
    const expected = (200 + 100) / Math.SQRT2
    expect(box.maxX - box.minX).toBeCloseTo(expected)
    expect(box.maxY - box.minY).toBeCloseTo(expected)
  })
})

describe('roomOutline', () => {
  it('starts at the top-left origin and goes clockwise', () => {
    expect(roomOutline(room)).toEqual([
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 300 },
      { x: 0, y: 300 },
    ])
  })
})

describe('isInsideRoom', () => {
  it('centred item fits', () => {
    expect(isInsideRoom(sofa, at(200, 150), room)).toBe(true)
  })

  it('touching walls exactly is allowed', () => {
    expect(isInsideRoom(sofa, at(100, 50), room)).toBe(true) // top-left corner at (0, 0)
    expect(isInsideRoom(sofa, at(300, 250), room)).toBe(true) // bottom-right at (400, 300)
  })

  it('one centimetre past any wall is outside', () => {
    expect(isInsideRoom(sofa, at(99, 150), room)).toBe(false)
    expect(isInsideRoom(sofa, at(301, 150), room)).toBe(false)
    expect(isInsideRoom(sofa, at(200, 49), room)).toBe(false)
    expect(isInsideRoom(sofa, at(200, 251), room)).toBe(false)
  })

  it('rotation is taken into account', () => {
    // 200 deep after rotating 90°: centre y = 50 pokes 50 cm out of the top wall.
    expect(isInsideRoom(sofa, at(200, 50, 0), room)).toBe(true)
    expect(isInsideRoom(sofa, at(200, 50, 90), room)).toBe(false)
  })

  it('margin keeps a gap from every wall', () => {
    expect(isInsideRoom(sofa, at(100, 50), room, 10)).toBe(false)
    expect(isInsideRoom(sofa, at(110, 60), room, 10)).toBe(true)
  })

  it('tolerates floating-point noise from rotation', () => {
    // At 90° the corners come out as 99.99999999999999 etc.
    expect(isInsideRoom(sofa, at(50, 100, 90), room)).toBe(true)
  })
})

describe('findFittingRotation', () => {
  it('returns 0 when the item fits as-is', () => {
    expect(findFittingRotation(sofa, room)).toBe(0)
  })

  it('returns 90 when it only fits rotated (200×100 in a 120×210 room)', () => {
    expect(findFittingRotation(sofa, { widthCm: 120, lengthCm: 210 })).toBe(90)
  })

  it('returns null when it fits at no right angle (200×100 in 150×150)', () => {
    expect(findFittingRotation(sofa, { widthCm: 150, lengthCm: 150 })).toBeNull()
  })
})

describe('scene mapping (contract with US-06a renderer)', () => {
  it('cm -> metres, plan y -> scene z', () => {
    const scene = toScene(at(250, 120))
    expect(scene.x).toBe(2.5)
    expect(scene.z).toBe(1.2)
  })

  it('clockwise on the plan is a negative Y rotation', () => {
    expect(toScene(at(0, 0, 90)).rotationY).toBeCloseTo(-Math.PI / 2)
    expect(toScene(at(0, 0, 0)).rotationY).toBeCloseTo(0)
  })

  it('size maps to metres', () => {
    expect(sizeToScene(sofa)).toEqual({ width: 2, depth: 1 })
  })
})
