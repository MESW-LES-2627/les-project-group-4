import ReactThreeTestRenderer from '@react-three/test-renderer'
import { OrthographicCamera as OrthographicCameraImpl } from 'three'
import { describe, expect, it } from 'vitest'

import { fitOrthoFrustum } from './ortho'
import { FitOrthoCamera } from './plan2d'

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

describe('FitOrthoCamera', () => {
  it('looks straight down at the room centre with the plan upright', async () => {
    const room = { widthCm: 300, lengthCm: 400 }
    const renderer = await ReactThreeTestRenderer.create(<FitOrthoCamera room={room} />)

    const camera = renderer.scene.findAll(
      (node) => node.instance instanceof OrthographicCameraImpl,
    )[0].instance as OrthographicCameraImpl
    const frustum = fitOrthoFrustum(room, 1280 / 800)

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
})
