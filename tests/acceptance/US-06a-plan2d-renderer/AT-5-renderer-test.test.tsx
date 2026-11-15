import ReactThreeTestRenderer from '@react-three/test-renderer'
import { describe, expect, it } from 'vitest'

describe(
  'AT-5 — Renderer test: the plan scene can be mounted with the test renderer',
  { tags: ['acceptance', 'US-06a', 'AT-5'] },
  () => {
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
  },
)
