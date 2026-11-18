import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '@/api/types'
import { GET } from '@/app/api/items/route'
import { catalogHref, hasFilters } from '@/lib/catalogFilters'
import { listItemsQuerySchema } from '@/lib/schemas/item'

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

const bed: CatalogItem = {
  id: 2,
  slug: 'bed-double-oak',
  name: 'Double bed, oak',
  category: 'bed',
  widthCm: 160,
  depthCm: 205,
  heightCm: 95,
  priceCents: 44900,
  styleTags: ['nordic'],
  roomTypeTags: ['bedroom'],
}

function getRequest(query = ''): Request {
  return new Request(`http://localhost/api/items${query}`)
}

beforeEach(() => {
  findMany.mockReset()
})

describe(
  'AT-6 — Clear filters: the unfiltered catalog returns',
  { tags: ['acceptance', 'US-08', 'AT-6'] },
  () => {
    it('clearing every filter leads to plain /catalog', () => {
      const active = { category: 'sofa' as const, maxPriceCents: 50000, style: ['nordic'] }

      expect(hasFilters(active)).toBe(true)
      expect(hasFilters({})).toBe(false)
      expect(catalogHref({})).toBe('/catalog')
    })

    it('the unfiltered request has no where at all, so every item comes back', async () => {
      findMany.mockResolvedValue([sofa, bed])

      const response = await GET(getRequest())

      expect(await response.json()).toEqual([sofa, bed])
      expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }))
    })

    it('empty tag lists count as no filter', () => {
      expect(hasFilters(listItemsQuerySchema.parse({ style: [], room: [] }))).toBe(false)
    })
  },
)
