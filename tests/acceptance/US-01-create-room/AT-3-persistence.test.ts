import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/rooms/route'

const { createRoom } = vi.hoisted(() => ({ createRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { create: createRoom } }),
}))

const validBody = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }
const noLocation = { city: null, latitude: null, longitude: null }

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  createRoom.mockReset()
  vi.restoreAllMocks()
})

describe(
  'AT-3 — Persistence: the room is saved with the submitted values',
  { tags: ['acceptance', 'US-01', 'AT-3'] },
  () => {
    it('passes the parsed values to the database', async () => {
      createRoom.mockResolvedValue({ id: 1, ...validBody, ...noLocation } as never)

      await POST(postRequest(validBody))

      expect(createRoom).toHaveBeenCalledWith(
        expect.objectContaining({ data: validBody }),
      )
    })
  },
)
