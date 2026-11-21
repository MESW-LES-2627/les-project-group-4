import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '@/api/types'
import type { ValidationErrorBody } from '@/lib/http'
import { GET } from '@/app/api/items/route'
import { parsePriceInput, toQueryString } from '@/lib/catalogFilters'

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ item: { findMany } }),
}))

const sofa: CatalogItem = {
  id: 1,
  slug: 'sofa-nordic-3-seat',
  name: 'Nordic 3-seat sofa',
  category: 'sofa',
  widthCm: 210,
  depthCm: 90,
  heightCm: 80,
  priceCents: 49900,
  styleTags: ['nordic'],
  roomTypeTags: ['living-room'],
}

function getRequest(query = ''): Request {
  return new Request(`http://localhost/api/items${query}`)
}

beforeEach(() => {
  findMany.mockReset()
})

describe(
  'AT-1 — Maximum price: only items priced at the maximum or less are shown',
  { tags: ['acceptance', 'US-08', 'AT-1'] },
  () => {
    it('?maxPrice=500 asks the database for prices up to and including 50000 cents', async () => {
      findMany.mockResolvedValue([sofa])

      const response = await GET(getRequest('?maxPrice=500'))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([sofa])
      // lte, not lt: an item at exactly €500 is "€500 or less".
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { priceCents: { lte: 50000 } } }),
      )
    })

    it.each([
      ['499.99', 49999],
      ['0.29', 29], // 0.29 * 100 is 28.999... in floating point; must round to 29
      ['0', 0],
    ])('converts %s euros to %i cents', async (euros, cents) => {
      findMany.mockResolvedValue([])

      await GET(getRequest(`?maxPrice=${euros}`))

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { priceCents: { lte: cents } } }),
      )
    })

    it.each([
      ['empty', '?maxPrice='],
      ['text', '?maxPrice=abc'],
      ['negative', '?maxPrice=-5'],
      ['exponent', '?maxPrice=1e3'],
      ['three decimals', '?maxPrice=5.555'],
      ['repeated', '?maxPrice=100&maxPrice=200'],
      ['above the INT column', '?maxPrice=99999999'],
    ])('returns 400 for a %s maximum price without touching the database', async (_label, query) => {
      const response = await GET(getRequest(query))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(Object.keys(body.errors)).toEqual(['maxPrice'])
      expect(findMany).not.toHaveBeenCalled()
    })

    it.each([
      ['500', 50000],
      ['499.99', 49999],
      ['499,99', 49999], // pt-PT decimal comma, as prices are displayed
      [' 300 ', 30000],
    ])('the price field reads "%s" as %i cents', (text, cents) => {
      expect(parsePriceInput(text)).toBe(cents)
    })

    it('an empty price field removes the filter; invalid text is rejected', () => {
      expect(parsePriceInput('')).toBeUndefined()
      expect(parsePriceInput('abc')).toBeNull()
      expect(parsePriceInput('-5')).toBeNull()
    })

    it('writes the maximum price back to the URL in euros', () => {
      expect(toQueryString({ maxPriceCents: 50000 })).toBe('?maxPrice=500')
      expect(toQueryString({ maxPriceCents: 49999 })).toBe('?maxPrice=499.99')
    })
  },
)
