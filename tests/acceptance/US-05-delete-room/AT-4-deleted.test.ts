import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE, GET as getRoom } from '@/app/api/rooms/[id]/route'
import { GET as listRooms } from '@/app/api/rooms/route'

// A small in-memory "database" behind getDb(), so the test follows what the user sees: the
// room is listed, it is deleted, and the next load (a reload of /rooms or of the room page)
// no longer has it. The real queries are the server functions the routes and pages share.
const rows = vi.hoisted(() => ({ rooms: [] as Array<{ id: number; name: string }> }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: {
      findMany: async () => rows.rooms.map((room) => ({ ...room })),
      findUnique: async ({ where }: { where: { id: number } }) =>
        rows.rooms.find((room) => room.id === where.id) ?? null,
      deleteMany: async ({ where }: { where: { id: number } }) => {
        const before = rows.rooms.length
        rows.rooms = rows.rooms.filter((room) => room.id !== where.id)
        return { count: before - rows.rooms.length }
      },
    },
  }),
}))

function remove(id: string) {
  return DELETE(new Request(`http://localhost/api/rooms/${id}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
}

async function listedNames() {
  const response = await listRooms()
  return ((await response.json()) as Array<{ name: string }>).map((room) => room.name)
}

beforeEach(() => {
  rows.rooms = [
    { id: 3, name: 'Bedroom' },
    { id: 4, name: 'Office' },
  ]
})

describe(
  'AT-4 — Deleted: a confirmed delete removes the room, and it is still gone after a reload',
  { tags: ['acceptance', 'US-05', 'AT-4'] },
  () => {
    it('the room leaves the list and its page is not found any more; other rooms stay', async () => {
      expect(await listedNames()).toEqual(['Bedroom', 'Office'])

      const response = await remove('3')

      expect(response.status).toBe(204)
      expect(await listedNames()).toEqual(['Office'])
      const page = await getRoom(new Request('http://localhost/api/rooms/3'), {
        params: Promise.resolve({ id: '3' }),
      })
      expect(page.status).toBe(404)
    })

    it('deleting it again answers 404 and changes nothing', async () => {
      await remove('3')

      const again = await remove('3')

      expect(again.status).toBe(404)
      expect(await listedNames()).toEqual(['Office'])
    })
  },
)
