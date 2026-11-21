import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { BoxGeometry, Mesh, MeshBasicMaterial } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { dimensionLabelText, itemLabelText } from '@/features/plan/model/label'
import { SELECTED_ITEM_COLOR } from '@/components/plan/scene/PlacedItem'
import { RoomScene } from '@/components/plan/scene/RoomScene'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'

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
  'AT-4 — Identify items: labels and selection make each item identifiable',
  { tags: ['acceptance', 'US-06a', 'AT-4'] },
  () => {
    it('shows the item name when it is not selected', () => {
      expect(itemLabelText(sofa)).toBe('Sofa')
      expect(itemLabelText(sofa, false)).toBe('Sofa')
    })

    it('adds the footprint size when the item is selected', () => {
      expect(itemLabelText(sofa, true)).toBe('Sofa · 200 × 100 cm')
    })

    it('shows whole metres without decimals', () => {
      expect(dimensionLabelText(300)).toBe('3 m')
      expect(dimensionLabelText(400)).toBe('4 m')
    })

    it('keeps the centimetres that matter', () => {
      expect(dimensionLabelText(90)).toBe('0.9 m')
      expect(dimensionLabelText(87)).toBe('0.87 m')
      expect(dimensionLabelText(245)).toBe('2.45 m')
    })

    it('renders an optional label above the item', async () => {
      const renderLabel = vi.fn((item: PlacedItemData, selected: boolean) => (
        <mesh name={`item-label-${item.id}-${selected}`} />
      ))
      const renderer = await ReactThreeTestRenderer.create(
        <RoomScene room={room} items={[sofa]} selectedId="sofa" renderLabel={renderLabel} />,
      )

      const label = renderer.scene.findByProps({ name: 'item-label-sofa-true' }).instance

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
      await renderer.fireEvent(mesh, 'onClick', { delta: 0, stopPropagation: vi.fn() })

      expect(onSelect).toHaveBeenCalledWith('sofa')

      await renderer.unmount()
    })

    it('does not select when the pointer moved during the click', async () => {
      const onSelect = vi.fn()
      const renderer = await ReactThreeTestRenderer.create(
        <RoomScene room={room} items={[sofa]} selectedId={null} onSelect={onSelect} />,
      )

      const mesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa' })
      await renderer.fireEvent(mesh, 'onClick', { delta: 20, stopPropagation: vi.fn() })

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
  },
)
