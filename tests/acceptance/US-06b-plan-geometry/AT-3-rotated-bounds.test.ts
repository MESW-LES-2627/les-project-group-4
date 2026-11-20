import { describe, expect, it } from 'vitest'

import { boundingBox, footprintCorners } from '@/lib/geometry/plan'

const sofa = { widthCm: 200, depthCm: 100 }
const at = (xCm: number, yCm: number, rotationDeg = 0) => ({ xCm, yCm, rotationDeg })

describe(
  'AT-3 — Rotated bounds: a 200×100 cm item at 90° has 100×200 cm bounds',
  { tags: ['acceptance', 'US-06b', 'AT-3'] },
  () => {
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
  },
)
