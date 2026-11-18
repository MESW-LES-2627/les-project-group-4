import { beforeEach, describe, expect, it, vi } from 'vitest'

import { post, savedLayout, savedRow, validBody } from './fixtures'

const { findRoom, findItems, createLayout } = vi.hoisted(() => ({
  findRoom: vi.fn(),
  findItems: vi.fn(),
  createLayout: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { findUnique: findRoom },
    item: { findMany: findItems },
    layout: { create: createLayout },
  }),
}))

beforeEach(() => {
  for (const mock of [findRoom, findItems, createLayout]) mock.mockReset()
  vi.restoreAllMocks()
  findRoom.mockResolvedValue({ id: 3 })
  findItems.mockResolvedValue([{ id: 4, priceCents: 49900 }])
  createLayout.mockResolvedValue(savedRow)
})

describe(
  "AT-1 — Save: a named layout is saved with every item's x, y, rotation and catalog price",
  { tags: ['acceptance', 'US-13a', 'AT-1'] },
  () => {
    it('returns 201 with the saved layout and its items', async () => {
      const response = await post(validBody)

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual(savedLayout)
    })

    it('saves every item with its x, y and rotation under the room', async () => {
      await post(validBody)

      const { data } = createLayout.mock.calls[0][0]
      expect(data).toMatchObject({ roomId: 3, name: 'Cosy corner' })
      expect(data.items.create).toEqual([
        { itemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90, priceCents: 49900 },
      ])
    })

    it('copies the price from the catalog, not from the request', async () => {
      findItems.mockResolvedValue([{ id: 4, priceCents: 12345 }])

      await post(validBody)

      expect(createLayout.mock.calls[0][0].data.items.create[0].priceCents).toBe(12345)
    })
  },
)
