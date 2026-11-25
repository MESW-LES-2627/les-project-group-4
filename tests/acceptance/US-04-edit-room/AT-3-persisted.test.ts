import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, PATCH } from '@/app/api/rooms/[id]/route'

// A small in-memory "database" behind getDb(), so the test follows what the user sees: the
// edit is saved, and the next load of the room (a reload of its page) shows the new values.
const rows = vi.hoisted(() => ({
  rooms: [] as Array<{ id: number; name: string; widthCm: number; lengthCm: number }>,
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: {
      findUnique: async ({ where }: { where: { id: number } }) => {
        const row = rows.rooms.find((room) => room.id === where.id)
        return row ? { ...row, city: null, latitude: null, longitude: null } : null
      },
      updateMany: async ({ where, data }: { where: { id: number }; data: object }) => {
        const row = rows.rooms.find((room) => room.id === where.id)
        if (row) Object.assign(row, data)
        return { count: row ? 1 : 0 }
      },
    },
  }),
}))

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

async function reload(id: string) {
  const response = await GET(new Request(`http://localhost/api/rooms/${id}`), {
    params: Promise.resolve({ id }),
  })
  return response.json()
}

beforeEach(() => {
  rows.rooms = [
    { id: 3, name: 'Bedroom', widthCm: 300, lengthCm: 400 },
    { id: 4, name: 'Office', widthCm: 250, lengthCm: 250 },
  ]
})

describe(
  'AT-3 — Persisted edit: after saving, a reload shows the new name and dimensions',
  { tags: ['acceptance', 'US-04', 'AT-3'] },
  () => {
    it('saves the changes and the reloaded room has them; other rooms are untouched', async () => {
      const response = await patch('3', { name: '  Guest room ', widthCm: 280, lengthCm: 350 })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ id: 3, name: 'Guest room', widthCm: 280, lengthCm: 350 })
      expect(await reload('3')).toMatchObject({ name: 'Guest room', widthCm: 280, lengthCm: 350 })
      expect(await reload('4')).toMatchObject({ name: 'Office', widthCm: 250, lengthCm: 250 })
    })

    it('an invalid edit changes nothing', async () => {
      const response = await patch('3', { name: '', widthCm: 280, lengthCm: 350 })

      expect(response.status).toBe(400)
      expect(await reload('3')).toMatchObject({ name: 'Bedroom', widthCm: 300, lengthCm: 400 })
    })

    it('editing a room that no longer exists answers 404', async () => {
      const response = await patch('99', { name: 'Guest room', widthCm: 280, lengthCm: 350 })

      expect(response.status).toBe(404)
    })
  },
)
