import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room, ValidationErrorBody } from '@/api/types'

import { GET } from './route'

const { findRoom } = vi.hoisted(() => ({ findRoom: vi.fn() }))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { findUnique: findRoom } }),
}))

const room: Room = { id: 3, name: 'Living room', widthCm: 450, lengthCm: 500 }

/** Calls the handler the way Next.js does: `params` is a Promise. */
function get(id: string) {
  return GET(new Request(`http://localhost/api/rooms/${id}`), {
    params: Promise.resolve({ id }),
  })
}

beforeEach(() => {
  findRoom.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('GET /api/rooms/[id]', () => {
  it('returns 200 with the room', async () => {
    findRoom.mockResolvedValue(room as never)

    const response = await get('3')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(room)
    expect(findRoom).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 3 } }))
  })

  it('returns 404 when the room does not exist', async () => {
    findRoom.mockResolvedValue(null)

    const response = await get('999')

    expect(response.status).toBe(404)
  })

  it.each(['abc', '0', '-1', '1.5', '01', '99999999999'])(
    'returns 400 for the malformed id "%s" and does not touch the database',
    async (id) => {
      const response = await get(id)
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(typeof body.errors.id).toBe('string')
      expect(findRoom).not.toHaveBeenCalled()
    },
  )

  it('returns 500 without leaking the error when the database throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    findRoom.mockRejectedValue(new Error('connection refused'))

    const response = await get('3')
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toContain('connection refused')
    expect(text).not.toMatch(/\bat \S+:\d+:\d+/) // no stack-trace lines
    expect(consoleError).toHaveBeenCalled() // the details were logged on the server
  })
})

describe('response shape matches src/api/types.ts', () => {
  it('200 body has exactly the Room fields with the right types', async () => {
    findRoom.mockResolvedValue(room as never)

    const body: unknown = await (await get('3')).json()

    expect(body).toEqual({
      id: expect.any(Number),
      name: expect.any(String),
      widthCm: expect.any(Number),
      lengthCm: expect.any(Number),
    } satisfies Record<keyof Room, unknown>)
  })
})
