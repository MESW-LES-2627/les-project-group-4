import { describe, expect, it } from 'vitest'

import { normalizeRotation, roomOutline } from '@/features/plan/model/geometry'

const room = { widthCm: 400, lengthCm: 300 }

describe(
  'AT-1 — Contract: origin, axes, units and rotation direction are defined',
  { tags: ['acceptance', 'US-06b', 'AT-1'] },
  () => {
    it.each([
      [0, 0],
      [90, 90],
      [360, 0],
      [450, 90],
      [-90, 270],
      [-450, 270],
      [-360, 0], // -360 % 360 is -0 in JavaScript
      [-0, 0],
      [720, 0],
    ])('%d° -> %d°', (input, expected) => {
      expect(normalizeRotation(input)).toBe(expected)
    })

    it('starts at the top-left origin and goes clockwise', () => {
      expect(roomOutline(room)).toEqual([
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 300 },
        { x: 0, y: 300 },
      ])
    })
  },
)
