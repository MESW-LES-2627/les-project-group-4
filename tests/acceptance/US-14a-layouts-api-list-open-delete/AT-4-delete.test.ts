import { beforeEach, describe, expect, it, vi } from 'vitest'

import { remove } from './fixtures'

const { deleteLayouts } = vi.hoisted(() => ({ deleteLayouts: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ layout: { deleteMany: deleteLayouts } }),
}))

beforeEach(() => {
  deleteLayouts.mockReset()
  vi.restoreAllMocks()
})

describe(
  'AT-4 — Delete: deleting a saved layout gives 204',
  { tags: ['acceptance', 'US-14a', 'AT-4'] },
  () => {
    it('returns 204 with no body and deletes only that layout of that room', async () => {
      deleteLayouts.mockResolvedValue({ count: 1 })

      const response = await remove('3', '7')

      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
      expect(deleteLayouts).toHaveBeenCalledWith({ where: { id: 7, roomId: 3 } })
    })
  },
)
