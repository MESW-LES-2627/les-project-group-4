import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { BoxGeometry, Mesh, PerspectiveCamera as PerspectiveCameraImpl } from 'three'
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
  'AT-3 — Reusable scene: the same scene graph works with a perspective camera',
  { tags: ['acceptance', 'US-06a', 'AT-3'] },
  () => {
    it('renders the same scene graph and item components with a perspective camera', async () => {
      const planRenderer = await ReactThreeTestRenderer.create(
        <Plan2DScene room={room} items={[sofa]} />,
      )
      const planMesh = planRenderer.scene.findByProps({
        name: 'placed-item-mesh-sofa',
      }).instance as Mesh<BoxGeometry>
      const planWidth = planMesh.geometry.parameters.width
      const planDepth = planMesh.geometry.parameters.depth
      await planRenderer.unmount()

      const perspectiveRenderer = await ReactThreeTestRenderer.create(
        <>
          <perspectiveCamera position={[4, 4, 6]} />
          <RoomScene room={room} items={[sofa]} />
        </>,
      )

      const camera = perspectiveRenderer.scene.findAll(
        (node) => (node.instance as PerspectiveCameraImpl)?.isPerspectiveCamera,
      )[0]
      expect(camera).toBeDefined()

      expect(perspectiveRenderer.scene.findByProps({ name: 'room-scene' })).toBeDefined()
      expect(perspectiveRenderer.scene.findByProps({ name: 'room-items' })).toBeDefined()

      const perspectiveMesh = perspectiveRenderer.scene.findByProps({
        name: 'placed-item-mesh-sofa',
      }).instance as Mesh<BoxGeometry>
      expect(perspectiveMesh.geometry.parameters.width).toBeCloseTo(planWidth)
      expect(perspectiveMesh.geometry.parameters.depth).toBeCloseTo(planDepth)

      await perspectiveRenderer.unmount()
    })

    it('accepts a taller height for a future 3D view', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <RoomScene room={room} items={[sofa]} itemHeight={0.8} />,
      )

      const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa' })
        .instance as Mesh<BoxGeometry>
      expect(mesh.geometry.parameters.height).toBeCloseTo(0.8)
      expect(mesh.position.y).toBeCloseTo(0.4)

      await renderer.unmount()
    })
  },
)
