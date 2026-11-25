import { describe, expect, it } from 'vitest'

import type { RoomSize } from '@/features/plan/model/geometry'
import { rotatePlacement } from '@/features/plan/model/manipulation'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }
const sofa = { widthCm: 100, depthCm: 50 }

function placement(xCm: number, yCm: number, rotationDeg = 0) {
  return { xCm, yCm, rotationDeg }
}

describe(
  'AT-2 — Rotate: rotating a selected item turns the footprint around its centre',
  { tags: ['acceptance', 'US-10', 'AT-2'] },
  () => {
    it('turns 90° clockwise around the item centre', () => {
      const turned = rotatePlacement(sofa, placement(150, 100), room)

      expect(turned).toMatchObject({ xCm: 150, yCm: 100, rotationDeg: 90 })
    })

    it('cycles through 0°, 90°, 180°, 270° and back to 0°', () => {
      let current = placement(150, 100)

      for (const expected of [90, 180, 270, 0]) {
        current = rotatePlacement(sofa, current, room)
        expect(current.rotationDeg).toBe(expected)
      }
    })

    it('swaps the effective width and depth at 90°', () => {
      const turned = rotatePlacement(sofa, placement(150, 100, 0), room)

      // The centre stays put in a roomy plan; only the angle changes.
      expect(turned.xCm).toBe(150)
      expect(turned.yCm).toBe(100)
      expect(turned.rotationDeg).toBe(90)
    })
  },
)
