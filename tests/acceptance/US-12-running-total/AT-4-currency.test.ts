import { describe, expect, it } from 'vitest'

import { formatPriceCents } from '@/lib/catalog'
import { totalPriceCents } from '@/lib/layout/layout'

import { addAll, lamp, sofa } from './fixtures'

// PlacedItemsList shows the total with formatPriceCents, the same EUR formatter
// as the catalog (US-07), so these are the strings on screen.
describe(
  'AT-4 — Currency: the total is formatted as EUR',
  { tags: ['acceptance', 'US-12', 'AT-4'] },
  () => {
    it('shows 528,00 € for a sofa and a lamp', () => {
      const state = addAll([sofa, lamp])

      expect(formatPriceCents(totalPriceCents(state.byRoom[1] ?? []))).toBe('528,00 €')
    })

    it('groups thousands, e.g. 1 247,50 €', () => {
      expect(formatPriceCents(124750)).toMatch(/^1\s247,50\s€$/u)
    })
  },
)
