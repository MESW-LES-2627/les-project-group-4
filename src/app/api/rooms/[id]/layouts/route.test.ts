import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '@/lib/http'

import { GET, POST } from './route'

const { findRoom, findItems, findLayouts, createLayout } = vi.hoisted(() => ({
  findRoom: vi.fn(),
  findItems: vi.fn(),
  findLayouts: vi.fn(),
  createLayout: vi.fn(),
}))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { findUnique: findRoom },
    item: { findMany: findItems },
    layout: { findMany: findLayouts, create: createLayout },
  }),
}))

const sofa = { catalogItemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90 }
const validBody = { name: 'Cosy corner', items: [sofa] }

/** Calls a handler the way Next.js does: `params` is a Promise. */
function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

function post(body: unknown, id = '3') {
  const request = new Request(`http://localhost/api/rooms/${id}/layouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  return POST(request, context(id))
}

function get(id = '3') {
  return GET(new Request(`http://localhost/api/rooms/${id}/layouts`), context(id))
}

beforeEach(() => {
  for (const mock of [findRoom, findItems, findLayouts, createLayout]) mock.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
  findRoom.mockResolvedValue({ id: 3 })
  findItems.mockResolvedValue([{ id: 4, priceCents: 49900 }])
})

// The AT tests for these handlers (US-13a, US-14a) live in tests/acceptance.
describe('POST /api/rooms/[id]/layouts', () => {
  it('returns 400 for invalid JSON', async () => {
    const response = await post('{not json')

    expect(response.status).toBe(400)
    expect(((await response.json()) as ValidationErrorBody).errors.body).toBeDefined()
  })

  it.each(['abc', '0', '01'])('returns 400 for the malformed room id "%s"', async (id) => {
    const response = await post(validBody, id)

    expect(response.status).toBe(400)
    expect(findRoom).not.toHaveBeenCalled()
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    createLayout.mockRejectedValue(new Error('connection refused'))

    const response = await post(validBody)
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toContain('connection refused')
    expect(consoleError).toHaveBeenCalled()
  })
})

describe('GET /api/rooms/[id]/layouts', () => {
  it('returns 404 when the room does not exist', async () => {
    findRoom.mockResolvedValue(null)

    const response = await get('999')

    expect(response.status).toBe(404)
    expect(findLayouts).not.toHaveBeenCalled()
  })

  it('returns 400 for a malformed room id', async () => {
    const response = await get('abc')

    expect(response.status).toBe(400)
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    findLayouts.mockRejectedValue(new Error('connection refused'))

    const response = await get()

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('connection refused')
  })
})
