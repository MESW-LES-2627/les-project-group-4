import { describe, expect, it } from 'vitest'

import { ITEM_CATEGORIES, isItemCategory } from './catalog'
import { SAMPLE_SOURCES, SEED_CITIES, SEED_ITEMS } from './seed-data'

const slugsOf = (rows: { slug: string }[]) => rows.map((row) => row.slug)
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// Rough bounding box of mainland Portugal: catches swapped or mistyped coordinates.
const inPortugal = (lat: number, lng: number) => lat > 36.8 && lat < 42.2 && lng > -9.6 && lng < -6.1

describe('seed data (CH-02)', () => {
  it.each([
    ['cities', SEED_CITIES],
    ['items', SEED_ITEMS],
  ] as const)('%s have unique, URL-safe slugs (the upsert key)', (_label, rows) => {
    const slugs = slugsOf(rows)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(SLUG)
  })

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

  it('every category has at least one item, so US-07 can be demonstrated', () => {
    for (const category of ITEM_CATEGORIES) {
      expect(SEED_ITEMS.some((item) => item.category === category)).toBe(true)
    }
  })

  it('cities have coordinates inside Portugal', () => {
    for (const place of SEED_CITIES) {
      expect(inPortugal(place.latitude, place.longitude)).toBe(true)
    }
  })

  it('retailers are clearly marked as sample data', () => {
    for (const source of SAMPLE_SOURCES) expect(source).toMatch(/^sample-/)
  })
})

describe('seed data — database limits and formats (added after review)', () => {
  const INT4_MAX = 2_147_483_647 // Postgres INTEGER
  const fits = (value: string, max: number) => expect(value.length).toBeLessThanOrEqual(max)

  it('every string fits its VARCHAR column', () => {
    for (const c of SEED_CITIES) {
      fits(c.slug, 100)
      fits(c.name, 100)
    }
    for (const i of SEED_ITEMS) {
      fits(i.slug, 100)
      fits(i.name, 255)
      fits(i.category, 50)
      fits(i.source, 100)
      fits(i.sourceUrl, 500)
    }
  })

  it('country is exactly two upper-case letters (CHAR(2), ISO 3166-1)', () => {
    for (const c of SEED_CITIES) expect(c.country).toMatch(/^[A-Z]{2}$/)
  })

  it('prices and sizes fit a Postgres INTEGER', () => {
    for (const i of SEED_ITEMS) {
      for (const n of [i.priceCents, i.widthCm, i.depthCm, i.heightCm]) expect(n).toBeLessThanOrEqual(INT4_MAX)
    }
  })

  it('tags are non-empty, URL-safe and not repeated within an item', () => {
    for (const i of SEED_ITEMS) {
      for (const tags of [i.styleTags, i.roomTypeTags]) {
        expect(tags.length).toBeGreaterThan(0)
        expect(new Set(tags).size).toBe(tags.length)
        for (const tag of tags) expect(tag).toMatch(SLUG)
      }
    }
  })

  it('item names are unique, so catalog cards are distinguishable', () => {
    const names = SEED_ITEMS.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
