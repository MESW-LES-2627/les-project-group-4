import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogItem } from '@/api/types'
import { GET } from '@/app/api/items/route'

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ item: { findMany } }),
}))

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
  'AT-4 — AND across facets: style nordic and room type bedroom must both match',
  { tags: ['acceptance', 'US-08', 'AT-4'] },
  () => {
    it('?style=nordic&room=bedroom puts both facets in one where (AND)', async () => {
      findMany.mockResolvedValue([bed])

      const response = await GET(getRequest('?style=nordic&room=bedroom'))

      expect(await response.json()).toEqual([bed])
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { styleTags: { hasSome: ['nordic'] }, roomTypeTags: { hasSome: ['bedroom'] } },
        }),
      )
    })
  },
)
