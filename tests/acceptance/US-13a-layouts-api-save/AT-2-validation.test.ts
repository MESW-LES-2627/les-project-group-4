import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '@/api/types'

import { post, validBody } from './fixtures'

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
})

describe(
  'AT-2 — Validation: a blank name, an unknown catalog item or a missing room is rejected and nothing is saved',
  { tags: ['acceptance', 'US-13a', 'AT-2'] },
  () => {
    it.each(['', '   '])('returns 400 for the blank name %j', async (name) => {
      const response = await post({ ...validBody, name })
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors.name).toBe('is required')
      expect(createLayout).not.toHaveBeenCalled()
    })

    it('returns 400 when a catalog item does not exist', async () => {
      findItems.mockResolvedValue([])

      const response = await post(validBody)
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors.items).toMatch(/4 does not exist/)
      expect(createLayout).not.toHaveBeenCalled()
    })

    it('returns 404 when the room does not exist', async () => {
      findRoom.mockResolvedValue(null)

      const response = await post(validBody, '999')

      expect(response.status).toBe(404)
      expect(createLayout).not.toHaveBeenCalled()
    })
  },
)
