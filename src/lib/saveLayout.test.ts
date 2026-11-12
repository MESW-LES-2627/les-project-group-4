import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/lib/layout/layout'
import { DUPLICATE_LAYOUT_NAME } from '@/lib/schemas/layout'
import { describeSaveError, toSaveLayoutRequest } from '@/lib/saveLayout'

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
  describe('US-13b AT-1: name required', () => {
    it.each(['', '   '])('returns "is required" and no request for the name %j', (name) => {
      expect(toSaveLayoutRequest(name, [sofa])).toEqual({ ok: false, nameError: 'is required' })
    })
  })

  describe('US-13b AT-5: current items', () => {
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

    it('accepts an empty plan', () => {
      expect(toSaveLayoutRequest('Empty', [])).toEqual({
        ok: true,
        request: { name: 'Empty', items: [] },
      })
    })
  })
})

describe('describeSaveError', () => {
  it('US-13b AT-3: shows a duplicate name next to the name field', () => {
    expect(
      describeSaveError({ status: 409, message: DUPLICATE_LAYOUT_NAME, fieldErrors: { name: DUPLICATE_LAYOUT_NAME } }),
    ).toEqual({ nameError: DUPLICATE_LAYOUT_NAME })
  })

  it('US-13b AT-4: shows a server failure as a form message', () => {
    expect(
      describeSaveError({ status: 500, message: 'The server is unavailable right now.', fieldErrors: {} }),
    ).toEqual({ formError: 'The server is unavailable right now.' })
  })
})
