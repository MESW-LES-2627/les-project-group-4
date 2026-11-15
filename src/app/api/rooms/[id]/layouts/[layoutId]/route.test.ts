import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '@/api/types'

import { DELETE, GET } from './route'

const { findLayout, deleteLayouts } = vi.hoisted(() => ({
  findLayout: vi.fn(),
  deleteLayouts: vi.fn(),
}))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({ layout: { findFirst: findLayout, deleteMany: deleteLayouts } }),
}))

/** Calls a handler the way Next.js does: `params` is a Promise. */
function context(id: string, layoutId: string) {
  return { params: Promise.resolve({ id, layoutId }) }
}

function get(id = '3', layoutId = '7') {
  return GET(new Request(`http://localhost/api/rooms/${id}/layouts/${layoutId}`), context(id, layoutId))
}

function remove(id = '3', layoutId = '7') {
  return DELETE(
    new Request(`http://localhost/api/rooms/${id}/layouts/${layoutId}`, { method: 'DELETE' }),
    context(id, layoutId),
  )
}

beforeEach(() => {
  findLayout.mockReset()
  deleteLayouts.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

// The AT tests for these handlers (US-14a) live in tests/acceptance.
describe('GET /api/rooms/[id]/layouts/[layoutId]', () => {
  it.each([
    ['abc', '7', 'id'],
    ['3', 'abc', 'layoutId'],
    ['3', '0', 'layoutId'],
  ])('returns 400 for the malformed ids %s/%s', async (id, layoutId, field) => {
    const response = await get(id, layoutId)
    const body = (await response.json()) as ValidationErrorBody

    expect(response.status).toBe(400)
    expect(typeof body.errors[field]).toBe('string')
    expect(findLayout).not.toHaveBeenCalled()
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    findLayout.mockRejectedValue(new Error('connection refused'))

    const response = await get()

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('connection refused')
  })
})

describe('DELETE /api/rooms/[id]/layouts/[layoutId]', () => {
  it('returns 400 for a malformed layout id and deletes nothing', async () => {
    const response = await remove('3', '1.5')

    expect(response.status).toBe(400)
    expect(deleteLayouts).not.toHaveBeenCalled()
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteLayouts.mockRejectedValue(new Error('connection refused'))

    const response = await remove()

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('connection refused')
  })
})
