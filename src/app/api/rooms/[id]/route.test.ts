import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE, GET } from './route'

const { findRoom, deleteRooms } = vi.hoisted(() => ({ findRoom: vi.fn(), deleteRooms: vi.fn() }))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { findUnique: findRoom, deleteMany: deleteRooms } }),
}))

/** Calls the handler the way Next.js does: `params` is a Promise. */
function get(id: string) {
  return GET(new Request(`http://localhost/api/rooms/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function remove(id: string) {
  return DELETE(new Request(`http://localhost/api/rooms/${id}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
}

beforeEach(() => {
  findRoom.mockReset()
  deleteRooms.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('GET /api/rooms/[id] error handling', () => {
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

describe('DELETE /api/rooms/[id]', () => {
  it('returns 400 for a malformed id without touching the database', async () => {
    const response = await remove('abc')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ errors: { id: 'must be a positive whole number' } })
    expect(deleteRooms).not.toHaveBeenCalled()
  })

  it('returns 204 and deletes only that room (its layouts go by ON DELETE CASCADE)', async () => {
    deleteRooms.mockResolvedValue({ count: 1 })

    const response = await remove('3')

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(deleteRooms).toHaveBeenCalledWith({ where: { id: 3 } })
  })

  it('returns 404 when the room does not exist', async () => {
    deleteRooms.mockResolvedValue({ count: 0 })

    const response = await remove('42')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: 'Room not found.' })
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteRooms.mockRejectedValue(new Error('connection refused'))

    const response = await remove('3')
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toContain('connection refused')
    expect(consoleError).toHaveBeenCalled()
  })
})
