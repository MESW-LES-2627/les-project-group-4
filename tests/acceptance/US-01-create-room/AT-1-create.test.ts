import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room } from '@/api/types'
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
  'AT-1 — Create: a valid name and dimensions create the room',
  { tags: ['acceptance', 'US-01', 'AT-1'] },
  () => {
    it('returns 201 with the created room', async () => {
      createRoom.mockResolvedValue({ id: 1, ...validBody, ...noLocation } as never)

      const response = await POST(postRequest(validBody))

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual({ id: 1, ...validBody, ...noLocation })
    })

    it('the 201 body has exactly the Room fields with the right types', async () => {
      const roomShape = {
        id: expect.any(Number),
        name: expect.any(String),
        widthCm: expect.any(Number),
        lengthCm: expect.any(Number),
        city: null,
        latitude: null,
        longitude: null,
      } satisfies Record<keyof Room, unknown>
      createRoom.mockResolvedValue({ id: 7, ...validBody, ...noLocation } as never)

      const body: unknown = await (await POST(postRequest(validBody))).json()

      expect(body).toEqual(roomShape) // toEqual also fails on extra fields
    })
  },
)
