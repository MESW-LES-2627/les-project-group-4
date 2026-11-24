import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE } from '@/app/api/rooms/[id]/route'

const { deleteRooms } = vi.hoisted(() => ({ deleteRooms: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { deleteMany: deleteRooms } }),
}))

function remove(id: string) {
  return DELETE(new Request(`http://localhost/api/rooms/${id}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
}

beforeEach(() => {
  deleteRooms.mockReset()
  vi.restoreAllMocks()
})

// The room list is read from the database on every request (GET /api/rooms and the /rooms
// page, US-02), so a room deleted in the database is still gone after a reload.
describe(
  'AT-4 — Deleted: confirming deletes the room in the database',
  { tags: ['acceptance', 'US-05', 'AT-4'] },
  () => {
    it('returns 204 with no body and deletes that room only', async () => {
      deleteRooms.mockResolvedValue({ count: 1 })

      const response = await remove('3')

      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
      expect(deleteRooms).toHaveBeenCalledTimes(1)
      expect(deleteRooms).toHaveBeenCalledWith({ where: { id: 3 } })
    })

    it('returns 404 for a room that is already gone', async () => {
      deleteRooms.mockResolvedValue({ count: 0 })

      const response = await remove('3')

      expect(response.status).toBe(404)
    })
  },
)
