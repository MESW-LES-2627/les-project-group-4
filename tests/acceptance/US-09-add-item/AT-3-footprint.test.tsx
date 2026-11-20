import ReactThreeTestRenderer from '@react-three/test-renderer'
import type { BoxGeometry, Group, Mesh } from 'three'
import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/api/types'
import { Plan2DScene } from '@/components/plan/Plan2D'
import type { RoomSize } from '@/lib/geometry/plan'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/lib/layout/draft'

const room: RoomSize = { widthCm: 300, lengthCm: 200 }

const sofa: CatalogItem = {
  id: 12,
  slug: 'sofa-nordic-3-seat',
  name: 'Nordic 3-seat sofa',
  category: 'sofa',
  widthCm: 200,
  depthCm: 100,
  heightCm: 80,
  priceCents: 49900,
  styleTags: ['nordic'],
  roomTypeTags: ['living-room'],
}

const lamp: CatalogItem = {
  ...sofa,
  id: 13,
  slug: 'lamp-arc-floor',
  name: 'Arc floor lamp',
  category: 'lighting',
  widthCm: 40,
  depthCm: 40,
  heightCm: 170,
  priceCents: 3990,
}

describe(
  'AT-3 — True-to-scale footprint: an added item renders at its stored position and size',
  { tags: ['acceptance', 'US-09a', 'AT-3'] },
  () => {
    it('renders the added items on the plan at their stored x, y, rotation and size', async () => {
      const withSofa = draftReducer(EMPTY_DRAFT_STATE, {
        type: 'add',
        roomId: 1,
        room,
        id: 'sofa-1',
        item: sofa,
      })
      const withLamp = draftReducer(withSofa, {
        type: 'add',
        roomId: 1,
        room,
        id: 'lamp-1',
        item: lamp,
      })
      const items = withLamp.byRoom[1] ?? []

      const renderer = await ReactThreeTestRenderer.create(
        <Plan2DScene room={room} items={items} />,
      )

      const sofaGroup = renderer.scene.findByProps({ name: 'placed-item-sofa-1' })
        .instance as Group
      expect(sofaGroup.position.x).toBeCloseTo(1) // 100 cm
      expect(sofaGroup.position.z).toBeCloseTo(0.5) // 50 cm
      expect(sofaGroup.rotation.y).toBeCloseTo(0)

      const sofaMesh = renderer.scene.findByProps({ name: 'placed-item-mesh-sofa-1' })
        .instance as Mesh<BoxGeometry>
      expect(sofaMesh.geometry.parameters.width).toBeCloseTo(2)
      expect(sofaMesh.geometry.parameters.depth).toBeCloseTo(1)

      const lampGroup = renderer.scene.findByProps({ name: 'placed-item-lamp-1' })
        .instance as Group
      expect(lampGroup.position.x).toBeCloseTo(2.2) // 220 cm
      expect(lampGroup.position.z).toBeCloseTo(0.2) // 20 cm

      const lampMesh = renderer.scene.findByProps({ name: 'placed-item-mesh-lamp-1' })
        .instance as Mesh<BoxGeometry>
      expect(lampMesh.geometry.parameters.width).toBeCloseTo(0.4)
      expect(lampMesh.geometry.parameters.depth).toBeCloseTo(0.4)

      await renderer.unmount()
    })
  },
)
