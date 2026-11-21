import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '@/lib/http'
import { DUPLICATE_LAYOUT_NAME } from '@/lib/schemas/layout'

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
  'AT-3 — Unique name: a second layout with the same name in a room gets 409',
  { tags: ['acceptance', 'US-13a', 'AT-3'] },
  () => {
    it('returns 409 with the duplicate-name message', async () => {
      createLayout.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      )

      const response = await post(validBody)
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(409)
      expect(body.errors.name).toBe(DUPLICATE_LAYOUT_NAME)
    })
  },
)
