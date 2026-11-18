import { describe, expect, it } from 'vitest'

import type { PlacedItem } from '@/lib/layout/layout'
import { toSaveLayoutRequest } from '@/lib/saveLayout'

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

describe(
  'AT-1 — Name required: a blank name shows "is required" and no request is sent',
  { tags: ['acceptance', 'US-13b', 'AT-1'] },
  () => {
    it.each(['', '   '])('returns "is required" and no request for the name %j', (name) => {
      expect(toSaveLayoutRequest(name, [sofa])).toEqual({ ok: false, nameError: 'is required' })
    })
  },
)
