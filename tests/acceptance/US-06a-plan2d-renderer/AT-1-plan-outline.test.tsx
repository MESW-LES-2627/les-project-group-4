import ReactThreeTestRenderer from '@react-three/test-renderer'
import type {
  BufferAttribute,
  LineLoop,
  Mesh,
  OrthographicCamera as OrthographicCameraImpl,
  PlaneGeometry,
} from 'three'
import { describe, expect, it } from 'vitest'

import { fitOrthoFrustum } from '@/features/plan/model/ortho'
import { FitOrthoCamera } from '@/components/plan/Plan2D'
import { RoomScene } from '@/components/plan/scene/RoomScene'

const room = { widthCm: 300, lengthCm: 400 }

describe(
  'AT-1 — Plan outline: the room is drawn to scale in an orthographic top-down view',
  { tags: ['acceptance', 'US-06a', 'AT-1'] },
  () => {
    it('renders the floor at the room dimensions in metres', async () => {
      const renderer = await ReactThreeTestRenderer.create(<RoomScene room={room} />)

      const floor = renderer.scene.findByProps({ name: 'room-floor' })
        .instance as Mesh<PlaneGeometry>

      expect(floor.geometry.parameters.width).toBeCloseTo(3)
      expect(floor.geometry.parameters.height).toBeCloseTo(4)
      expect(floor.position.x).toBeCloseTo(1.5)
      expect(floor.position.z).toBeCloseTo(2)

      await renderer.unmount()
    })

    it('renders the outline from the room corners in scene metres', async () => {
      const renderer = await ReactThreeTestRenderer.create(<RoomScene room={room} />)

      const outline = renderer.scene.findByProps({ name: 'room-outline' }).instance as LineLoop
      const position = outline.geometry.getAttribute('position') as BufferAttribute

      expect(Array.from(position.array)).toEqual([0, 0, 0, 3, 0, 0, 3, 0, 4, 0, 0, 4])

      await renderer.unmount()
    })

    it('renders no item meshes for an empty layout', async () => {
      const renderer = await ReactThreeTestRenderer.create(
        <RoomScene room={room} items={[]} />,
      )

      expect(renderer.scene.findByProps({ name: 'room-items' }).children).toEqual([])

      await renderer.unmount()
    })

    it('looks straight down at the room centre with the plan upright', async () => {
      const renderer = await ReactThreeTestRenderer.create(<FitOrthoCamera room={room} />)

      // Duck-type the camera: R3F loads its own copy of three (CJS), so an
      // instanceof check against this file's ESM import never matches.
      const camera = renderer.scene.findAll(
        (node) => (node.instance as OrthographicCameraImpl)?.isOrthographicCamera,
      )[0].instance as OrthographicCameraImpl
      const frustum = fitOrthoFrustum(room, 1280 / 800)

      // R3F resizes the default camera in pixels on every canvas resize; the
      // camera must opt out so the world-unit frustum below survives resizes.
      expect((camera as OrthographicCameraImpl & { manual?: boolean }).manual).toBe(true)

      expect(camera.position.x).toBeCloseTo(1.5)
      expect(camera.position.y).toBeCloseTo(10)
      expect(camera.position.z).toBeCloseTo(2)
      expect(camera.rotation.x).toBeCloseTo(-Math.PI / 2)
      expect(camera.up.z).toBe(-1)
      expect(camera.left).toBeCloseTo(frustum.left)
      expect(camera.right).toBeCloseTo(frustum.right)
      expect(camera.top).toBeCloseTo(frustum.top)
      expect(camera.bottom).toBeCloseTo(frustum.bottom)

      await renderer.unmount()
    })
  },
)
