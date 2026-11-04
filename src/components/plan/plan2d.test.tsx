import ReactThreeTestRenderer from '@react-three/test-renderer'
import { describe, expect, it } from 'vitest'

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
