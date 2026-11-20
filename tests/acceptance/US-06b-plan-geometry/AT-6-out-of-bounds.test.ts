import { describe, expect, it } from 'vitest'

import { isInsideRoom } from '@/lib/geometry/plan'

const sofa = { widthCm: 200, depthCm: 100 }
const room = { widthCm: 400, lengthCm: 300 }
const at = (xCm: number, yCm: number, rotationDeg = 0) => ({ xCm, yCm, rotationDeg })

describe(
  'AT-6 — Out of bounds: an item outside the room is flagged',
  { tags: ['acceptance', 'US-06b', 'AT-6'] },
  () => {
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

    it('margin keeps a gap from every wall', () => {
      expect(isInsideRoom(sofa, at(100, 50), room, 10)).toBe(false)
      expect(isInsideRoom(sofa, at(110, 60), room, 10)).toBe(true)
    })

    it('tolerates floating-point noise from rotation', () => {
      // At 90° the corners come out as 99.99999999999999 etc.
      expect(isInsideRoom(sofa, at(50, 100, 90), room)).toBe(true)
    })
  },
)
