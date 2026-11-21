import { describe, expect, it } from 'vitest'

import { totalPriceCents } from '@/features/plan/model/layout'

import { addAll, lamp, sofa } from './fixtures'

describe(
  'AT-2 — Add: adding an item increases the total by its price',
  { tags: ['acceptance', 'US-12', 'AT-2'] },
  () => {
    it('grows by the price of the added item', () => {
      const before = addAll([sofa])
      const after = addAll([lamp], before)

      expect(totalPriceCents(after.byRoom[1] ?? []) - totalPriceCents(before.byRoom[1] ?? [])).toBe(
        lamp.priceCents,
      )
    })

    it('counts the same catalog item twice when it is added twice', () => {
      const state = addAll([lamp, lamp])

      expect(totalPriceCents(state.byRoom[1] ?? [])).toBe(2 * lamp.priceCents)
    })
  },
)
