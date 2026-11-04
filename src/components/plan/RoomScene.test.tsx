import ReactThreeTestRenderer from '@react-three/test-renderer'
import type {
  BoxGeometry,
  BufferAttribute,
  Group,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
} from 'three'
import { describe, expect, it, vi } from 'vitest'

import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

import { SELECTED_ITEM_COLOR } from './PlacedItem'
import { RoomScene } from './RoomScene'

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

  it('renders no item meshes for an empty layout', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene room={room} items={[]} />,
    )

    expect(renderer.scene.findByProps({ name: 'room-items' }).children).toEqual([])

    await renderer.unmount()
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

  it('renders an optional label above the item', async () => {
    const renderLabel = vi.fn((item: PlacedItemData, selected: boolean) => (
      <mesh name={`item-label-${item.id}-${selected}`} />
    ))
    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene
        room={room}
        items={[sofa]}
        selectedId="sofa"
        renderLabel={renderLabel}
      />,
    )

    const label = renderer.scene.findByProps({
      name: 'item-label-sofa-true',
    }).instance

    expect(renderLabel).toHaveBeenCalledWith(sofa, true)
    expect(label.parent?.position.y).toBeCloseTo(0.07)

    await renderer.unmount()
  })

  it('marks the selected item with the accent colour', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene room={room} items={[sofa]} selectedId="sofa" />,
    )

    const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa' })
      .instance as Mesh<BoxGeometry, MeshBasicMaterial>
    expect(mesh.material.color.getHexString()).toBe(SELECTED_ITEM_COLOR.slice(1))

    await renderer.unmount()
  })

  it('selects an item on click', async () => {
    const onSelect = vi.fn()
    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene room={room} items={[sofa]} selectedId={null} onSelect={onSelect} />,
    )

    const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa' })
    await renderer.fireEvent(mesh, 'onClick', {
      delta: 0,
      stopPropagation: vi.fn(),
    })

    expect(onSelect).toHaveBeenCalledWith('sofa')

    await renderer.unmount()
  })

  it('does not select when the pointer moved during the click', async () => {
    const onSelect = vi.fn()
    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene room={room} items={[sofa]} selectedId={null} onSelect={onSelect} />,
    )

    const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa' })
    await renderer.fireEvent(mesh, 'onClick', {
      delta: 20,
      stopPropagation: vi.fn(),
    })

    expect(onSelect).not.toHaveBeenCalled()

    await renderer.unmount()
  })

  it('clears the selection when the floor is clicked', async () => {
    const onSelect = vi.fn()
    const renderer = await ReactThreeTestRenderer.create(
      <RoomScene room={room} items={[sofa]} selectedId="sofa" onSelect={onSelect} />,
    )

    const floor = renderer.scene.findByProps({ name: 'room-floor' })
    await renderer.fireEvent(floor, 'onClick', { stopPropagation: vi.fn() })

    expect(onSelect).toHaveBeenCalledWith(null)

    await renderer.unmount()
  })
})
