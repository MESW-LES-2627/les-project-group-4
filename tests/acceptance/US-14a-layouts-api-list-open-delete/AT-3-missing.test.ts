import { beforeEach, describe, expect, it, vi } from 'vitest'

import { open, remove } from './fixtures'

const { findLayout, deleteLayouts } = vi.hoisted(() => ({
  findLayout: vi.fn(),
  deleteLayouts: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ layout: { findFirst: findLayout, deleteMany: deleteLayouts } }),
}))

beforeEach(() => {
  findLayout.mockReset()
  deleteLayouts.mockReset()
  vi.restoreAllMocks()
})

describe(
  'AT-3 — Missing: a layout that does not exist or belongs to another room gives 404',
  { tags: ['acceptance', 'US-14a', 'AT-3'] },
  () => {
    it('returns 404 when opening a layout that is not in this room', async () => {
      findLayout.mockResolvedValue(null)

      const response = await open('3', '999')

      expect(response.status).toBe(404)
    })

    it('returns 404 when deleting a layout that is not in this room', async () => {
      deleteLayouts.mockResolvedValue({ count: 0 })

      const response = await remove('3', '999')

      expect(response.status).toBe(404)
      expect(deleteLayouts).toHaveBeenCalledWith({ where: { id: 999, roomId: 3 } })
    })
  },
)
