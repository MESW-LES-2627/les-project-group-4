import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import { GET } from '@/app/api/items/route'
import { catalogHref } from '@/features/catalog/model/catalogFilters'

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
  'AT-5 — Combined with category: only sofas within the price limit are shown',
  { tags: ['acceptance', 'US-08', 'AT-5'] },
  () => {
    it('?category=sofa&maxPrice=500 filters by both', async () => {
      findMany.mockResolvedValue([sofa])

      const response = await GET(getRequest('?category=sofa&maxPrice=500'))

      expect(await response.json()).toEqual([sofa])
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'sofa', priceCents: { lte: 50000 } } }),
      )
    })

    it('a category link keeps the active price and tag filters; "All" drops only the category', () => {
      const active = { maxPriceCents: 50000, style: ['nordic'] }

      expect(catalogHref({ ...active, category: 'sofa' })).toBe(
        '/catalog?category=sofa&maxPrice=500&style=nordic',
      )
      expect(catalogHref({ ...active, category: undefined })).toBe(
        '/catalog?maxPrice=500&style=nordic',
      )
    })
  },
)
