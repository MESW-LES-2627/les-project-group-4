import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LayoutDetails } from '@/features/rooms/types'

import { open, savedRow } from './fixtures'

const { findLayout } = vi.hoisted(() => ({ findLayout: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ layout: { findFirst: findLayout } }),
}))

beforeEach(() => {
  findLayout.mockReset()
  vi.restoreAllMocks()
  findLayout.mockResolvedValue(savedRow)
})

describe(
  'AT-2 — Open: a saved layout comes back with its items, x, y, rotation and saved price',
  { tags: ['acceptance', 'US-14a', 'AT-2'] },
  () => {
    it('returns 200 with the items, their positions, rotations and saved prices', async () => {
      const response = await open()
      const body = (await response.json()) as LayoutDetails

      expect(response.status).toBe(200)
      expect(body.items).toEqual([
        {
          id: 11,
          catalogItemId: 4,
          name: 'Sofa',
          widthCm: 200,
          depthCm: 90,
          priceCents: 49900,
          xCm: 120,
          yCm: 45.5,
          rotationDeg: 90,
        },
      ])
    })

    it('only looks for the layout inside the room from the URL', async () => {
      await open('3', '7')

      expect(findLayout).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 7, roomId: 3 } }),
      )
    })
  },
)
