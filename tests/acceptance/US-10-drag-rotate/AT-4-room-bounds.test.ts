import { describe, expect, it } from 'vitest'

import type { Point, RoomSize } from '@/features/plan/model/geometry'
import { isInsideRoom } from '@/features/plan/model/geometry'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/features/plan/model/draft'
import type { PlacedItem } from '@/features/plan/model/layout'
import { dragPlacement, rotatePlacement } from '@/features/plan/model/manipulation'
import { DOES_NOT_FIT_MESSAGE } from '@/features/plan/model/placement'

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

    it('refuses a rotation whose turned footprint cannot fit, keeping the item where it was', () => {
      // 250 × 90 fits upright, but turned it needs 250 cm of depth in a 200 cm room.
      const longSofa: PlacedItem = {
        id: 'sofa-1',
        catalogItemId: 12,
        name: 'Long sofa',
        widthCm: 250,
        depthCm: 90,
        priceCents: 49900,
        xCm: 150,
        yCm: 100,
        rotationDeg: 0,
      }
      const state = { ...EMPTY_DRAFT_STATE, byRoom: { 1: [longSofa] } }

      const next = draftReducer(state, {
        type: 'update-placement',
        roomId: 1,
        room,
        id: longSofa.id,
        placement: { xCm: 150, yCm: 100, rotationDeg: 90 },
      })

      expect(next.byRoom[1]?.[0]).toBe(longSofa)
      expect(next.error).toEqual({ roomId: 1, message: DOES_NOT_FIT_MESSAGE })
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
