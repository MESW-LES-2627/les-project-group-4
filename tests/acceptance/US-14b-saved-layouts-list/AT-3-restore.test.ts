import { describe, expect, it } from 'vitest'

import type { LayoutDetails } from '@/api/types'
import { toDraftItems } from '@/lib/savedLayouts'

const layout: LayoutDetails = {
  id: 4,
  roomId: 1,
  name: 'Cosy corner',
  createdAt: '2026-11-12T10:00:00.000Z',
  updatedAt: '2026-11-12T10:00:00.000Z',
  items: [
    {
      id: 10,
      catalogItemId: 3,
      name: 'Sofa',
      widthCm: 200,
      depthCm: 90,
      priceCents: 49900,
      xCm: 100,
      yCm: 45,
      rotationDeg: 0,
    },
    {
      id: 11,
      catalogItemId: 8,
      name: 'Bookshelf',
      widthCm: 80,
      depthCm: 30,
      priceCents: 12900,
      xCm: 285,
      yCm: 140,
      rotationDeg: 90,
    },
  ],
}

// Clicking Open is UI (no component test harness yet, #66 CH-05); this checks what
// the plan receives once the layout is loaded.
describe(
  'AT-3 — Restore: opening a layout puts its items, positions and rotations on the plan',
  { tags: ['acceptance', 'US-14b', 'AT-3'] },
  () => {
    it('restores every item with its position and rotation', () => {
      const items = toDraftItems(layout)

      expect(
        items.map(({ catalogItemId, name, widthCm, depthCm, priceCents, xCm, yCm, rotationDeg }) => ({
          catalogItemId,
          name,
          widthCm,
          depthCm,
          priceCents,
          xCm,
          yCm,
          rotationDeg,
        })),
      ).toEqual(
        layout.items.map(({ catalogItemId, name, widthCm, depthCm, priceCents, xCm, yCm, rotationDeg }) => ({
          catalogItemId,
          name,
          widthCm,
          depthCm,
          priceCents,
          xCm,
          yCm,
          rotationDeg,
        })),
      )
    })
  },
)
