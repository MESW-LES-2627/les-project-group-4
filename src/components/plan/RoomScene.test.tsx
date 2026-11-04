import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { BufferAttribute, LineLoop, Mesh, PlaneGeometry } from 'three'
import { describe, expect, it } from 'vitest'

import { RoomScene } from './RoomScene'

const room = { widthCm: 300, lengthCm: 400 }

describe('RoomScene', () => {
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
})
