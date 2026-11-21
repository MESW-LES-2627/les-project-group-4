import { describe, expect, it } from 'vitest'

import { sizeToScene, toScene } from '@/features/plan/model/geometry'

const sofa = { widthCm: 200, depthCm: 100 }
const at = (xCm: number, yCm: number, rotationDeg = 0) => ({ xCm, yCm, rotationDeg })

describe(
  'AT-2 — cm to metres: the renderer boundary converts 100 cm to 1 m',
  { tags: ['acceptance', 'US-06b', 'AT-2'] },
  () => {
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
  },
)
