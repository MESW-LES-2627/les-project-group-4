import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/items/route'
import { toggleTag } from '@/lib/catalogFilters'

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ item: { findMany } }),
}))

function getRequest(query = ''): Request {
  return new Request(`http://localhost/api/items${query}`)
}

beforeEach(() => {
  findMany.mockReset()
})

describe(
  'AT-3 — OR within a facet: nordic and modern show items of either style',
  { tags: ['acceptance', 'US-08', 'AT-3'] },
  () => {
    it('?style=nordic&style=modern matches items with any of the two (hasSome)', async () => {
      findMany.mockResolvedValue([])

      await GET(getRequest('?style=nordic&style=modern'))

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { styleTags: { hasSome: ['nordic', 'modern'] } } }),
      )
    })

    it('selecting a second tag adds it; selecting it again removes it', () => {
      expect(toggleTag(['nordic'], 'modern')).toEqual(['nordic', 'modern'])
      expect(toggleTag(['nordic', 'modern'], 'modern')).toEqual(['nordic'])
      expect(toggleTag(['nordic'], 'nordic')).toBeUndefined()
    })
  },
)
