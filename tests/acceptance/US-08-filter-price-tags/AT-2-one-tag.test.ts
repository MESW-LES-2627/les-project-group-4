import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '@/features/catalog/types'
import type { ValidationErrorBody } from '@/lib/http'
import { GET } from '@/app/api/items/route'
import { tagLabel } from '@/features/catalog/model/catalogFilters'
import { findTagOptions } from '@/features/catalog/server/items'

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
  'AT-2 — One tag: only items tagged with the selected style are shown',
  { tags: ['acceptance', 'US-08', 'AT-2'] },
  () => {
    it('?style=nordic keeps items whose styleTags contain nordic', async () => {
      findMany.mockResolvedValue([sofa])

      const response = await GET(getRequest('?style=nordic'))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([sofa])
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { styleTags: { hasSome: ['nordic'] } } }),
      )
    })

    it('returns 200 with an empty list for a well-formed tag nobody uses', async () => {
      findMany.mockResolvedValue([])

      const response = await GET(getRequest('?style=baroque'))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
    })

    it.each([
      ['capitalised', 'Nordic'],
      ['spaces', 'living%20room'],
      ['empty', ''],
    ])('returns 400 for a %s tag without touching the database', async (_label, tag) => {
      const response = await GET(getRequest(`?style=${tag}`))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(Object.keys(body.errors)).toEqual(['style'])
      expect(findMany).not.toHaveBeenCalled()
    })

    it('offers every tag used in the catalog once, sorted, as the filter options', async () => {
      findMany.mockResolvedValue([
        { styleTags: ['nordic'], roomTypeTags: ['living-room', 'office'] },
        { styleTags: ['modern', 'nordic'], roomTypeTags: ['bedroom'] },
      ])

      expect(await findTagOptions()).toEqual({
        style: ['modern', 'nordic'],
        room: ['bedroom', 'living-room', 'office'],
      })
    })

    it.each([
      ['nordic', 'Nordic'],
      ['living-room', 'Living room'],
    ])('shows the tag %s as "%s"', (tag, label) => {
      expect(tagLabel(tag)).toBe(label)
    })
  },
)
