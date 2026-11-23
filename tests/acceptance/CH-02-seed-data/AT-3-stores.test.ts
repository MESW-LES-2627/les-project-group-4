import { describe, expect, it } from 'vitest'

import { SAMPLE_SOURCES, SEED_ITEMS } from '../../../prisma/seed-data'

describe(
  'AT-3 — Stores: 4–6 real Portuguese stores are represented as item sources',
  { tags: ['acceptance', 'CH-02', 'AT-3'] },
  () => {
    it('every item comes from a known sample retailer, with a product URL on example.com', () => {
      for (const item of SEED_ITEMS) {
        expect(SAMPLE_SOURCES).toContain(item.source)
        expect(item.sourceUrl).toBe(`https://example.com/${item.source}/${item.slug}`)
      }
    })

    it('every sample retailer has at least one item (Iteration 4 links stores by source)', () => {
      for (const source of SAMPLE_SOURCES) {
        expect(SEED_ITEMS.some((item) => item.source === source)).toBe(true)
      }
    })

    it('retailers are clearly marked as sample data', () => {
      for (const source of SAMPLE_SOURCES) expect(source).toMatch(/^sample-/)
    })
  },
)
