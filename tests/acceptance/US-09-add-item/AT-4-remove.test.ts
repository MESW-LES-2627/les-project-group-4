import { describe, expect, it } from 'vitest'

import type { CatalogItem } from '@/api/types'
import type { RoomSize } from '@/lib/geometry/plan'
import { EMPTY_DRAFT_STATE, draftReducer } from '@/lib/layout/draft'
import type { PlacedItem } from '@/lib/layout/layout'

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

/** The input US-12 (#34) will total in the UI; kept local so this story does not own the total. */
const totalCents = (items: PlacedItem[]) =>
  items.reduce((sum, item) => sum + item.priceCents, 0)

describe(
  'AT-4 — Remove item: removing a placed item drops it from the layout',
  { tags: ['acceptance', 'US-09a', 'AT-4'] },
  () => {
    it('removes only that item and the priced total no longer includes it', () => {
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
      expect(totalCents(withLamp.byRoom[1] ?? [])).toBe(53890)

      const after = draftReducer(withLamp, { type: 'remove', roomId: 1, id: 'sofa-1' })
      const items = after.byRoom[1] ?? []

      expect(items.map((item) => item.id)).toEqual(['lamp-1'])
      expect(totalCents(items)).toBe(3990)
      expect(after.error).toBeNull()
    })
  },
)
