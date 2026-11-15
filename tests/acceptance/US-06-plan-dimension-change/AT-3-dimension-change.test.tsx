import ReactThreeTestRenderer from '@react-three/test-renderer'
import type {
  BufferAttribute,
  Group,
  LineLoop,
  Mesh,
  OrthographicCamera as OrthographicCameraImpl,
  PlaneGeometry,
} from 'three'
import { describe, expect, it } from 'vitest'

import { RoomScene } from '@/components/plan/scene/RoomScene'
import { fitOrthoFrustum } from '@/components/plan/ortho'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'
import { FitOrthoCamera } from '@/components/plan/Plan2D'

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
  'AT-3 — Dimension change: the outline and camera follow the new room dimensions',
  { tags: ['acceptance', 'US-06', 'AT-3'] },
  () => {
    it('updates the floor, outline and item placement when the room dimensions change', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <RoomScene room={room} items={[sofa]} />,
      )

      const resizedRoom = { widthCm: 600, lengthCm: 200 }
      await renderer.update(<RoomScene room={resizedRoom} items={[sofa]} />)

      const floor = renderer.scene.findByProps({ name: 'room-floor' })
        .instance as Mesh<PlaneGeometry>
      expect(floor.geometry.parameters.width).toBeCloseTo(6)
      expect(floor.geometry.parameters.height).toBeCloseTo(2)
      expect(floor.position.x).toBeCloseTo(3)
      expect(floor.position.z).toBeCloseTo(1)

      const outline = renderer.scene.findByProps({ name: 'room-outline' }).instance as LineLoop
      const position = outline.geometry.getAttribute('position') as BufferAttribute
      expect(Array.from(position.array)).toEqual([0, 0, 0, 6, 0, 0, 6, 0, 2, 0, 0, 2])

      // Positions are stored in cm from the room origin, so the item keeps its
      // placement while the floor and outline follow the new dimensions.
      const group = renderer.scene.findByProps({ name: 'placed-item-sofa' })
        .instance as Group
      expect(group.position.x).toBeCloseTo(2.5)
      expect(group.position.z).toBeCloseTo(1.2)

      await renderer.unmount()
    })

    it('refits the camera when the room dimensions change', async () => {
      const renderer = await ReactThreeTestRenderer.create(<FitOrthoCamera room={room} />)

      const resizedRoom = { widthCm: 600, lengthCm: 200 }
      await renderer.update(<FitOrthoCamera room={resizedRoom} />)

      const camera = renderer.scene.findAll(
        (node) => (node.instance as OrthographicCameraImpl)?.isOrthographicCamera,
      )[0].instance as OrthographicCameraImpl
      const frustum = fitOrthoFrustum(resizedRoom, 1280 / 800)

      expect(camera.position.x).toBeCloseTo(3)
      expect(camera.position.z).toBeCloseTo(1)
      expect(camera.left).toBeCloseTo(frustum.left)
      expect(camera.right).toBeCloseTo(frustum.right)
      expect(camera.top).toBeCloseTo(frustum.top)
      expect(camera.bottom).toBeCloseTo(frustum.bottom)

      await renderer.unmount()
    })
  },
)
