import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room, ValidationErrorBody } from '@/api/types'
import { GET } from '@/app/api/rooms/[id]/route'

const { findRoom } = vi.hoisted(() => ({ findRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { findUnique: findRoom } }),
}))

const room: Room = {
  id: 3,
  name: 'Living room',
  widthCm: 450,
  lengthCm: 500,
  city: { id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 },
  latitude: null,
  longitude: null,
}

/** Calls the handler the way Next.js does: `params` is a Promise. */
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
  'AT-2 — Load by id: the API fetches the room in the URL',
  { tags: ['acceptance', 'US-03', 'AT-2'] },
  () => {
    it('returns 200 with the room', async () => {
      findRoom.mockResolvedValue(room as never)

      const response = await get('3')

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(room)
      expect(findRoom).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 3 } }))
    })

    it('the 200 body has exactly the Room fields with the right types', async () => {
      findRoom.mockResolvedValue(room as never)

      const body: unknown = await (await get('3')).json()

      expect(body).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        widthCm: expect.any(Number),
        lengthCm: expect.any(Number),
        city: expect.any(Object),
        latitude: null,
        longitude: null,
      } satisfies Record<keyof Room, unknown>)
    })

    it.each(['abc', '0', '-1', '1.5', '01', '99999999999'])(
      'returns 400 for the malformed id "%s" and does not touch the database',
      async (id) => {
        const response = await get(id)
        const body = (await response.json()) as ValidationErrorBody

        expect(response.status).toBe(400)
        expect(typeof body.errors.id).toBe('string')
        expect(findRoom).not.toHaveBeenCalled()
      },
    )
  },
)
