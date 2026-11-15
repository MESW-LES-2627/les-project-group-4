import { describe, expect, it } from 'vitest'

import { SEED_CITIES, SEED_ITEMS } from '@/lib/seedData'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

describe(
  'AT-1 — Idempotent seed: the upsert key (slug) is unique and stable',
  { tags: ['acceptance', 'CH-02', 'AT-1'] },
  () => {
    it.each([
      ['cities', SEED_CITIES],
      ['items', SEED_ITEMS],
    ] as const)('%s have unique, URL-safe slugs (the upsert key)', (_label, rows) => {
      const slugs = rows.map((row) => row.slug)

      expect(new Set(slugs).size).toBe(slugs.length)
      for (const slug of slugs) expect(slug).toMatch(SLUG)
    })
  },
)
