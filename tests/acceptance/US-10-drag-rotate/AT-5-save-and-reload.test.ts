import { describe, expect, it } from 'vitest'

import type { LayoutDetails } from '@/features/rooms/types'
import { toSaveLayoutRequest } from '@/features/rooms/model/saveLayout'
import { toDraftItems } from '@/features/rooms/model/savedLayouts'

const draggedAndRotatedItem = {
  id: 'local-1',
  catalogItemId: 4,
  name: 'Sofa',
  widthCm: 200,
  depthCm: 90,
  priceCents: 49900,
  xCm: 120,
  yCm: 45.5,
  rotationDeg: 90,
}

describe(
  'AT-5 — Save and reload: a dragged and rotated item keeps its position and rotation',
  { tags: ['acceptance', 'US-10', 'AT-5'] },
  () => {
    it('includes x, y and rotation in the save request', () => {
      const result = toSaveLayoutRequest('Cosy corner', [draggedAndRotatedItem])

      expect(result.ok && result.request.items[0]).toEqual({
        catalogItemId: 4,
        xCm: 120,
        yCm: 45.5,
        rotationDeg: 90,
      })
    })

    it('restores x, y and rotation when loading the saved layout back into the plan', () => {
      const saved: LayoutDetails = {
        id: 7,
        roomId: 1,
        name: 'Cosy corner',
        createdAt: '2026-11-12T10:00:00.000Z',
        updatedAt: '2026-11-12T10:00:00.000Z',
        items: [{ ...draggedAndRotatedItem, id: 1 }],
      }

      const restored = toDraftItems(saved)

      expect(restored[0]).toMatchObject({
        xCm: 120,
        yCm: 45.5,
        rotationDeg: 90,
      })
    })
  },
)
