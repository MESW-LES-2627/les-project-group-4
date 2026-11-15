import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LayoutSummary } from '@/api/types'

import { list, savedAt } from './fixtures'

const { findRoom, findLayouts } = vi.hoisted(() => ({
  findRoom: vi.fn(),
  findLayouts: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { findUnique: findRoom },
    layout: { findMany: findLayouts },
  }),
}))

beforeEach(() => {
  findRoom.mockReset()
  findLayouts.mockReset()
  vi.restoreAllMocks()
  findRoom.mockResolvedValue({ id: 3 })
})

describe(
  'AT-1 — List: each saved layout comes back by name with its item count',
  { tags: ['acceptance', 'US-14a', 'AT-1'] },
  () => {
    it('returns 200 with each layout by name, its item count and when it was saved', async () => {
      findLayouts.mockResolvedValue([
        { id: 2, name: 'Bright', updatedAt: savedAt, _count: { items: 3 } },
        { id: 7, name: 'Cosy corner', updatedAt: savedAt, _count: { items: 1 } },
      ])

      const response = await list()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([
        { id: 2, name: 'Bright', itemCount: 3, updatedAt: savedAt.toISOString() },
        { id: 7, name: 'Cosy corner', itemCount: 1, updatedAt: savedAt.toISOString() },
      ] satisfies LayoutSummary[])
      expect(findLayouts).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomId: 3 },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
        }),
      )
    })

    it('returns 200 with an empty array when the room has no saved layouts', async () => {
      findLayouts.mockResolvedValue([])

      const response = await list()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
    })
  },
)
