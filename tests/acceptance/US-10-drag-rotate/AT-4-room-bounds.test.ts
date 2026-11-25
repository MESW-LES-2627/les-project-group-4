import { describe, expect, it } from 'vitest'

import type { Point, RoomSize } from '@/features/plan/model/geometry'
import { isInsideRoom } from '@/features/plan/model/geometry'
import { dragPlacement, rotatePlacement } from '@/features/plan/model/manipulation'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }
const sofa = { widthCm: 100, depthCm: 50 }

function placement(xCm: number, yCm: number, rotationDeg = 0) {
  return { xCm, yCm, rotationDeg }
}

function point(x: number, y: number): Point {
  return { x, y }
}

describe(
  'AT-4 — Room bounds: a dragged item cannot be dropped outside the room',
  { tags: ['acceptance', 'US-10', 'AT-4'] },
  () => {
    it('keeps the item inside when the pointer is dragged past the right wall', () => {
      const dragged = dragPlacement(
        sofa,
        placement(150, 100),
        point(400, 100),
        { x: 0, y: 0 },
        room,
      )

      expect(isInsideRoom(sofa, dragged, room)).toBe(true)
      expect(dragged.xCm).toBeLessThanOrEqual(250)
    })

    it('keeps the item inside when the pointer is dragged past the top wall', () => {
      const dragged = dragPlacement(
        sofa,
        placement(150, 100),
        point(150, -50),
        { x: 0, y: 0 },
        room,
      )

      expect(isInsideRoom(sofa, dragged, room)).toBe(true)
      expect(dragged.yCm).toBeGreaterThanOrEqual(25)
    })

    it('nudges a rotated item back inside when its new footprint would leave the room', () => {
      // Place the long edge of the sofa along the top wall; rotating 90° would
      // make the 100 cm depth poke out unless the centre is nudged down.
      const turned = rotatePlacement(sofa, placement(150, 30), room)

      expect(isInsideRoom(sofa, turned, room)).toBe(true)
      expect(turned.rotationDeg).toBe(90)
    })

    it('centres an item larger than the room instead of inverting the clamp range', () => {
      const largeRoom = { widthCm: 300, lengthCm: 200 }
      const huge = { widthCm: 400, depthCm: 300 }

      const dragged = dragPlacement(
        huge,
        placement(150, 100),
        point(500, 500),
        { x: 0, y: 0 },
        largeRoom,
      )

      expect(dragged.xCm).toBe(150)
      expect(dragged.yCm).toBe(100)
    })
  },
)
