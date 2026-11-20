import { describe, expect, it } from 'vitest'

import { draftReducer } from '@/lib/layout/draft'
import { totalPriceCents } from '@/lib/layout/layout'

import { addAll, lamp, sofa } from './fixtures'

describe(
  'AT-3 — Remove: removing an item decreases the total by its price',
  { tags: ['acceptance', 'US-12', 'AT-3'] },
  () => {
    it('shrinks by the price of the removed item', () => {
      const before = addAll([sofa, lamp])
      const sofaId = before.byRoom[1]?.find((item) => item.catalogItemId === sofa.id)?.id ?? ''
      const after = draftReducer(before, { type: 'remove', roomId: 1, id: sofaId })

      expect(totalPriceCents(before.byRoom[1] ?? []) - totalPriceCents(after.byRoom[1] ?? [])).toBe(
        sofa.priceCents,
      )
    })
  },
)
