import { describe, expect, it } from 'vitest'

import { findFittingRotation, isInsideRoom } from '@/lib/geometry/plan'

const sofa = { widthCm: 200, depthCm: 100 }
const room = { widthCm: 400, lengthCm: 300 }
const at = (xCm: number, yCm: number, rotationDeg = 0) => ({ xCm, yCm, rotationDeg })

describe(
  'AT-4 — Fit with rotation: 200×100 fits a 150×150 room at 90° but not at 0°',
  { tags: ['acceptance', 'US-06b', 'AT-4'] },
  () => {
    it('rotation is taken into account when checking the room bounds', () => {
      // 200 deep after rotating 90°: centre y = 50 pokes 50 cm out of the top wall.
      expect(isInsideRoom(sofa, at(200, 50, 0), room)).toBe(true)
      expect(isInsideRoom(sofa, at(200, 50, 90), room)).toBe(false)
    })

    it('returns 0 when the item fits as-is', () => {
      expect(findFittingRotation(sofa, room)).toBe(0)
    })

    it('returns 90 when it only fits rotated (200×100 in a 120×210 room)', () => {
      expect(findFittingRotation(sofa, { widthCm: 120, lengthCm: 210 })).toBe(90)
    })

    it('returns null when it fits at no right angle (200×100 in 150×150)', () => {
      expect(findFittingRotation(sofa, { widthCm: 150, lengthCm: 150 })).toBeNull()
    })
  },
)
