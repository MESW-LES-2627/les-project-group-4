import ReactThreeTestRenderer from '@react-three/test-renderer'
import type {
  BoxGeometry,
  Mesh,
  OrthographicCamera as OrthographicCameraImpl,
  PerspectiveCamera as PerspectiveCameraImpl,
} from 'three'
import { describe, expect, it } from 'vitest'

import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

import { fitOrthoFrustum } from './ortho'
import { FitOrthoCamera, Plan2DScene } from './Plan2D'
import { RoomScene } from './scene/RoomScene'

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

describe('plan renderer test setup', () => {
  it('mounts a mesh in the R3F scene graph', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <mesh name="smoke-test">
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </mesh>,
    )

    const mesh = renderer.scene.findByProps({ name: 'smoke-test' })

    expect(mesh.instance.type).toBe('Mesh')
    await renderer.unmount()
  })
})

describe('Plan2D scene', () => {
  it('renders one placed item when mounted with one item', async () => {
    // The Canvas needs DOM/WebGL, so mount the exact R3F subtree Plan2D uses.
    const renderer = await ReactThreeTestRenderer.create(
      <Plan2DScene room={room} items={[sofa]} />,
    )

    expect(
      renderer.scene.findByProps({ name: 'placed-item-sofa' }),
    ).toBeDefined()

    const mesh = renderer.scene.findByProps({
      name: 'placed-item-mesh-sofa',
    }).instance as Mesh<BoxGeometry>
    expect(mesh.geometry.parameters.width).toBeCloseTo(2)
    expect(mesh.geometry.parameters.depth).toBeCloseTo(1)

    await renderer.unmount()
  })
})

describe('FitOrthoCamera', () => {
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
})

describe('reusable scene (AT-4)', () => {
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

    expect(
      perspectiveRenderer.scene.findByProps({ name: 'room-scene' }),
    ).toBeDefined()
    expect(
      perspectiveRenderer.scene.findByProps({ name: 'room-items' }),
    ).toBeDefined()

    const perspectiveMesh = perspectiveRenderer.scene.findByProps({
      name: 'placed-item-mesh-sofa',
    }).instance as Mesh<BoxGeometry>
    expect(perspectiveMesh.geometry.parameters.width).toBeCloseTo(planWidth)
    expect(perspectiveMesh.geometry.parameters.depth).toBeCloseTo(planDepth)

    await perspectiveRenderer.unmount()
  })
})
