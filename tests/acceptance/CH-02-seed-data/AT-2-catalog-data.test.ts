import { describe, expect, it } from 'vitest'

import { ITEM_CATEGORIES } from '@/lib/catalog'
import { isItemCategory } from '@/lib/schemas/item'
import { SEED_ITEMS } from '@/lib/seedData'

const INT4_MAX = 2_147_483_647 // Postgres INTEGER

describe(
  'AT-2 — Catalog data: about 30 items across 5 categories with cm sizes and prices',
  { tags: ['acceptance', 'CH-02', 'AT-2'] },
  () => {
    it('items have valid categories, positive whole-cm sizes and integer-cent prices', () => {
      for (const item of SEED_ITEMS) {
        expect(isItemCategory(item.category)).toBe(true)
        for (const size of [item.widthCm, item.depthCm, item.heightCm]) {
          expect(Number.isInteger(size)).toBe(true)
          expect(size).toBeGreaterThan(0)
        }
        expect(Number.isInteger(item.priceCents)).toBe(true)
        expect(item.priceCents).toBeGreaterThan(0)
      }
    })

    it('every category has at least one item', () => {
      for (const category of ITEM_CATEGORIES) {
        expect(SEED_ITEMS.some((item) => item.category === category)).toBe(true)
      }
    })

    it('every string fits its VARCHAR column', () => {
      const fits = (value: string, max: number) =>
        expect(value.length).toBeLessThanOrEqual(max)

      for (const item of SEED_ITEMS) {
        fits(item.slug, 100)
        fits(item.name, 255)
        fits(item.category, 50)
        fits(item.source, 100)
        fits(item.sourceUrl, 500)
      }
    })

    it('prices and sizes fit a Postgres INTEGER', () => {
      for (const item of SEED_ITEMS) {
        for (const n of [item.priceCents, item.widthCm, item.depthCm, item.heightCm]) {
          expect(n).toBeLessThanOrEqual(INT4_MAX)
        }
      }
    })

    it('tags are non-empty, URL-safe and not repeated within an item', () => {
      const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

      for (const item of SEED_ITEMS) {
        for (const tags of [item.styleTags, item.roomTypeTags]) {
          expect(tags.length).toBeGreaterThan(0)
          expect(new Set(tags).size).toBe(tags.length)
          for (const tag of tags) expect(tag).toMatch(slug)
        }
      }
    })

    it('item names are unique, so catalog cards are distinguishable', () => {
      const names = SEED_ITEMS.map((item) => item.name)

      expect(new Set(names).size).toBe(names.length)
    })
  },
)
