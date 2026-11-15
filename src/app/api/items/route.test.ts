import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

const { findItems } = vi.hoisted(() => ({ findItems: vi.fn() }))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({ item: { findMany: findItems } }),
}))

function getRequest(query = ''): Request {
  return new Request(`http://localhost/api/items${query}`)
}

beforeEach(() => {
  findItems.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('GET /api/items error handling', () => {
  it('returns 500 with a generic message when the database fails', async () => {
    // The route logs the real error on purpose; silence it so the test output stays clean.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    findItems.mockRejectedValue(new Error('connection refused'))

    const response = await GET(getRequest())
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain('connection refused')
    expect(consoleError).toHaveBeenCalledOnce()
  })
})
