import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/rooms/[id]/route'

const { findRoom } = vi.hoisted(() => ({ findRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { findUnique: findRoom } }),
}))

function get(id: string) {
  return GET(new Request(`http://localhost/api/rooms/${id}`), {
    params: Promise.resolve({ id }),
  })
}

beforeEach(() => {
  findRoom.mockReset()
  vi.restoreAllMocks()
})

describe(
  'AT-3 — Missing room: a clear not-found state instead of a crash',
  { tags: ['acceptance', 'US-03', 'AT-3'] },
  () => {
    it('returns 404 with a message when the room does not exist', async () => {
      findRoom.mockResolvedValue(null)

      const response = await get('999')

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ message: 'Room not found.' })
    })
  },
)
