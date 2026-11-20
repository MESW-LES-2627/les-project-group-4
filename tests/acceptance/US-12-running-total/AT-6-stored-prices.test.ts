import { describe, expect, it } from 'vitest'

import { totalPriceCents } from '@/lib/layout/layout'

import { addAll, sofa } from './fixtures'

describe(
  'AT-6 — Stored prices: the total uses the prices stored on the placed items',
  { tags: ['acceptance', 'US-12', 'AT-6'] },
  () => {
    it('keeps the price copied when the item was placed, even if the catalog changes', () => {
      const catalogItem = { ...sofa }
      const state = addAll([catalogItem])

      // The catalog price changes after the item was placed.
      catalogItem.priceCents = 59900

      expect(totalPriceCents(state.byRoom[1] ?? [])).toBe(49900)
    })

    it('adds whatever price each placed item carries, with no fixed values', () => {
      expect(totalPriceCents([{ priceCents: 1 }, { priceCents: 250 }, { priceCents: 100000 }])).toBe(
        100251,
      )
    })
  },
)
