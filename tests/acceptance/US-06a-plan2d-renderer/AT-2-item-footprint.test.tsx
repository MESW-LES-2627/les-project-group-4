import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { BoxGeometry, Group, Mesh } from 'three'
import { describe, expect, it } from 'vitest'

import { Plan2DScene } from '@/components/plan/Plan2D'
import { RoomScene } from '@/components/plan/scene/RoomScene'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

const room = { widthCm: 300, lengthCm: 400 }

const sofa: PlacedItemData = {
  id: 'sofa',
  catalogItemId: 1,
  name: 'Sofa',
  widthCm: 200,
  depthCm: 100,
  xCm: 250,
  yCm: 120,
  rotationDeg: 90,
  priceCents: 49900,
}

describe(
  'AT-2 — Item footprint: a placed item is true to scale at its position and rotation',
  { tags: ['acceptance', 'US-06a', 'AT-2'] },
  () => {
    it('renders one item at its stored position, rotation and size', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <RoomScene room={room} items={[sofa]} />,
      )

      const group = renderer.scene.findByProps({ name: 'placed-item-sofa' })
        .instance as Group
      expect(group.position.x).toBeCloseTo(2.5)
      expect(group.position.z).toBeCloseTo(1.2)
      expect(group.rotation.y).toBeCloseTo(-Math.PI / 2)

      const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa' })
        .instance as Mesh<BoxGeometry>
      expect(mesh.geometry.parameters.width).toBeCloseTo(2)
      expect(mesh.geometry.parameters.height).toBeCloseTo(0.02)
      expect(mesh.geometry.parameters.depth).toBeCloseTo(1)
      expect(mesh.position.y).toBeCloseTo(0.01)

      await renderer.unmount()
    })

    it('renders one placed item when the Plan2D scene is mounted with one item', async () => {
      // The Canvas needs DOM/WebGL, so mount the exact R3F subtree Plan2D uses.
      const renderer = await ReactThreeTestRenderer.create(
        <Plan2DScene room={room} items={[sofa]} />,
      )

      expect(renderer.scene.findByProps({ name: 'placed-item-sofa' })).toBeDefined()

      const mesh = renderer.scene.findByProps({
        name: 'placed-item-mesh-sofa',
      }).instance as Mesh<BoxGeometry>
      expect(mesh.geometry.parameters.width).toBeCloseTo(2)
      expect(mesh.geometry.parameters.depth).toBeCloseTo(1)

      await renderer.unmount()
    })
  },
)
