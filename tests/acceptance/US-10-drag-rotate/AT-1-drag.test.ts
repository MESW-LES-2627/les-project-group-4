import { describe, expect, it } from 'vitest'

import type { Point, RoomSize } from '@/features/plan/model/geometry'
import { dragPlacement } from '@/features/plan/model/manipulation'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }
const sofa = { widthCm: 100, depthCm: 50 }

function placement(xCm: number, yCm: number, rotationDeg = 0) {
  return { xCm, yCm, rotationDeg }
}

function point(x: number, y: number): Point {
  return { x, y }
}

describe(
  'AT-1 — Drag: dragging an item follows the pointer and drops at the new position',
  { tags: ['acceptance', 'US-10', 'AT-1'] },
  () => {
    it('keeps the grab point under the cursor while dragging', () => {
      const start = placement(50, 25)
      // The pointer grabbed the centre of the item.
      const grabOffset = { x: 0, y: 0 }

      const dragged = dragPlacement(sofa, start, point(120, 80), grabOffset, room)

      expect(dragged).toMatchObject({ xCm: 120, yCm: 80, rotationDeg: 0 })
    })

    it('preserves the grab offset from the original pointerdown', () => {
      const start = placement(50, 25)
      // The pointer grabbed the front-left corner, 30 cm right and 10 cm down from the centre.
      const grabOffset = { x: 30, y: 10 }

      const dragged = dragPlacement(sofa, start, point(120, 80), grabOffset, room)

      expect(dragged).toMatchObject({ xCm: 150, yCm: 90, rotationDeg: 0 })
    })

    it('snaps the final drop to whole centimetres', () => {
      const start = placement(50, 25)
      const grabOffset = { x: 0, y: 0 }

      const dragged = dragPlacement(sofa, start, point(120.7, 80.3), grabOffset, room)

      expect(dragged.xCm).toBe(121)
      expect(dragged.yCm).toBe(80)
    })
  },
)
