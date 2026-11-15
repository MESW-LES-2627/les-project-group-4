import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/rooms/route'

const { createRoom, findCity } = vi.hoisted(() => ({
  createRoom: vi.fn(),
  findCity: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { create: createRoom },
    city: { findUnique: findCity },
  }),
}))

const validBody = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }
const coordinates = { latitude: 41.15, longitude: -8.61 }

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  createRoom.mockReset()
  findCity.mockReset()
  vi.restoreAllMocks()
})

describe(
  'AT-6 — No reverse geocoding: saving coordinates makes no extra request',
  { tags: ['acceptance', 'US-15', 'AT-6'] },
  () => {
    it('stores the coordinates without a reverse-geocoding or city lookup', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      createRoom.mockResolvedValue({
        id: 1,
        ...validBody,
        city: null,
        ...coordinates,
      } as never)

      const response = await POST(postRequest({ ...validBody, ...coordinates }))

      expect(response.status).toBe(201)
      expect(findCity).not.toHaveBeenCalled()
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  },
)
