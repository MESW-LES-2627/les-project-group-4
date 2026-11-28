import ReactThreeTestRenderer from '@react-three/test-renderer'
import { describe, expect, it, vi } from 'vitest'

import type { RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'

import { RoomScene } from './RoomScene'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: PlacedItemData = {
  id: 'sofa-1',
  catalogItemId: 12,
  name: 'Sofa',
  widthCm: 100,
  depthCm: 50,
  priceCents: 49900,
  xCm: 50,
  yCm: 25,
  rotationDeg: 0,
}

describe('RoomScene item pointer events', () => {
  it('forwards every pointer event with the item it belongs to', async () => {
    const onItemPointerDown = vi.fn()
    const onItemPointerMove = vi.fn()
    const onItemPointerUp = vi.fn()
    const onItemPointerCancel = vi.fn()

    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene
        room={room}
        items={[sofa]}
        onItemPointerDown={onItemPointerDown}
        onItemPointerMove={onItemPointerMove}
        onItemPointerUp={onItemPointerUp}
        onItemPointerCancel={onItemPointerCancel}
      />,
    )

    const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa-1' })

    await renderer.fireEvent(mesh, 'onPointerDown', {})
    await renderer.fireEvent(mesh, 'onPointerMove', {})
    await renderer.fireEvent(mesh, 'onPointerUp', {})
    await renderer.fireEvent(mesh, 'onPointerCancel', {})

    expect(onItemPointerDown).toHaveBeenCalledWith(sofa, expect.anything())
    expect(onItemPointerMove).toHaveBeenCalledWith(sofa, expect.anything())
    expect(onItemPointerUp).toHaveBeenCalledWith(sofa, expect.anything())
    expect(onItemPointerCancel).toHaveBeenCalledWith(sofa, expect.anything())

    await renderer.unmount()
  })
})
