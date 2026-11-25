import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, PATCH } from '@/app/api/rooms/[id]/route'

const { updateRooms, findRoom } = vi.hoisted(() => ({ updateRooms: vi.fn(), findRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { updateMany: updateRooms, findUnique: findRoom } }),
}))

const saved = {
  id: 3,
  name: 'Guest room',
  widthCm: 280,
  lengthCm: 350,
  city: null,
  latitude: null,
  longitude: null,
}

function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/rooms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  )
}

beforeEach(() => {
  updateRooms.mockReset()
  findRoom.mockReset()
  vi.restoreAllMocks()
})

// The room page and GET /api/rooms/[id] read the room from the database on every request
// (US-03), so what PATCH saves is what a reload shows.
describe(
  'AT-3 — Persisted edit: the new name and dimensions are saved and returned',
  { tags: ['acceptance', 'US-04', 'AT-3'] },
  () => {
    it('saves the trimmed name and the dimensions of that room, and returns the updated room', async () => {
      updateRooms.mockResolvedValue({ count: 1 })
      findRoom.mockResolvedValue(saved)

      const response = await patch('3', { name: '  Guest room ', widthCm: 280, lengthCm: 350 })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(saved)
      expect(updateRooms).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { name: 'Guest room', widthCm: 280, lengthCm: 350 },
      })
    })

    it('a reload (GET) shows the saved values', async () => {
      findRoom.mockResolvedValue(saved)

      const response = await GET(new Request('http://localhost/api/rooms/3'), {
        params: Promise.resolve({ id: '3' }),
      })

      expect(await response.json()).toMatchObject({ name: 'Guest room', widthCm: 280, lengthCm: 350 })
    })

    it('returns 404 for a room that no longer exists', async () => {
      updateRooms.mockResolvedValue({ count: 0 })

      const response = await patch('3', { name: 'Guest room', widthCm: 280, lengthCm: 350 })

      expect(response.status).toBe(404)
      expect(findRoom).not.toHaveBeenCalled()
    })
  },
)
