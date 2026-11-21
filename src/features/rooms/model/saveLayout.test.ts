import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/features/plan/model/layout'
import { toSaveLayoutRequest } from '@/features/rooms/model/saveLayout'

const sofa: PlacedItem = {
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

describe('toSaveLayoutRequest', () => {
  describe('plan items in the request', () => {
    it('sends exactly the plan items with their x, y and rotation, and a trimmed name', () => {
      expect(toSaveLayoutRequest('  Cosy corner ', [sofa])).toEqual({
        ok: true,
        request: {
          name: 'Cosy corner',
          items: [{ catalogItemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90 }],
        },
      })
    })

    it('does not send the local id, size, name or price (the server takes them from the catalog)', () => {
      const result = toSaveLayoutRequest('Plan', [sofa])

      expect(result.ok && Object.keys(result.request.items[0]).sort()).toEqual([
        'catalogItemId',
        'rotationDeg',
        'xCm',
        'yCm',
      ])
    })

    // The helper does not judge the item count: the form blocks an empty plan (US-13b AT-6).
    it('builds a request with no items when given an empty list', () => {
      expect(toSaveLayoutRequest('Empty', [])).toEqual({
        ok: true,
        request: { name: 'Empty', items: [] },
      })
    })
  })
})
