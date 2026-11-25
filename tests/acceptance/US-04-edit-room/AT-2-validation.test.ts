import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PATCH } from '@/app/api/rooms/[id]/route'
import { POST } from '@/app/api/rooms/route'

const { updateRooms } = vi.hoisted(() => ({ updateRooms: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { updateMany: updateRooms } }),
}))

function send(handler: 'PATCH' | 'POST', body: unknown) {
  const init = { method: handler, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  return handler === 'PATCH'
    ? PATCH(new Request('http://localhost/api/rooms/3', init), { params: Promise.resolve({ id: '3' }) })
    : POST(new Request('http://localhost/api/rooms', init))
}

beforeEach(() => {
  updateRooms.mockReset()
  vi.restoreAllMocks()
})

// The API side of AT-2: the edit endpoint rejects what the create endpoint rejects, with the
// same field errors, so a client that skips the form checks gets the same answer.
describe(
  'AT-2 — Same validation as create: PATCH /api/rooms/[id] answers like POST /api/rooms',
  { tags: ['acceptance', 'US-04', 'AT-2'] },
  () => {
    it.each([
      ['a blank name', { name: '  ', widthCm: 300, lengthCm: 400 }],
      ['a zero width', { name: 'Bedroom', widthCm: 0, lengthCm: 400 }],
      ['a negative length', { name: 'Bedroom', widthCm: 300, lengthCm: -1 }],
      ['a decimal width', { name: 'Bedroom', widthCm: 30.5, lengthCm: 400 }],
      ['a missing length', { name: 'Bedroom', widthCm: 300 }],
    ])('returns the same 400 as create for %s, without saving', async (_case, body) => {
      const edit = await send('PATCH', body)
      const create = await send('POST', body)

      expect(edit.status).toBe(400)
      expect(await edit.json()).toEqual(await create.json())
      expect(updateRooms).not.toHaveBeenCalled()
    })
  },
)
