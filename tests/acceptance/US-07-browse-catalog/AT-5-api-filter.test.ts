import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogItem, ValidationErrorBody } from '@/api/types'
import { GET } from '@/app/api/items/route'

const { findItems } = vi.hoisted(() => ({ findItems: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ item: { findMany: findItems } }),
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
  findItems.mockReset()
  vi.restoreAllMocks()
})

describe(
  'AT-5 — API filter: GET /api/items?category=sofa returns only sofa items',
  { tags: ['acceptance', 'US-07', 'AT-5'] },
  () => {
    it('returns 200 with every item when no category is given', async () => {
      findItems.mockResolvedValue([sofa] as never)

      const response = await GET(getRequest())

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([sofa])
      expect(findItems).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }))
    })

    it('filters by a known category', async () => {
      findItems.mockResolvedValue([sofa] as never)

      await GET(getRequest('?category=sofa'))

      expect(findItems).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'sofa' } }),
      )
    })

    it('returns 200 with an empty array when no item matches', async () => {
      findItems.mockResolvedValue([] as never)

      const response = await GET(getRequest('?category=lighting'))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
    })

    it.each([
      ['unknown', 'rug'],
      ['empty', ''],
      ['capitalised', 'Sofa'],
    ])('returns 400 for a %s category and does not touch the database', async (_label, category) => {
      const response = await GET(getRequest(`?category=${encodeURIComponent(category)}`))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors).toEqual({
        category: 'must be one of: sofa, armchair, bed, table, chair, desk, storage, lighting',
      })
      expect(findItems).not.toHaveBeenCalled()
    })

    it('returns 400 when category is given more than once', async () => {
      const response = await GET(getRequest('?category=sofa&category=bed'))

      expect(response.status).toBe(400)
      expect(findItems).not.toHaveBeenCalled()
    })

    it('selects only the API fields, sorted by category, name, then id', async () => {
      findItems.mockResolvedValue([] as never)

      await GET(getRequest())

      const args = findItems.mock.calls[0][0]
      expect(Object.keys(args?.select ?? {}).sort()).toEqual(Object.keys(sofa).sort())
      expect(args?.orderBy).toEqual([
        { category: 'asc' },
        { name: 'asc' },
        { id: 'asc' },
      ])
    })
  },
)
