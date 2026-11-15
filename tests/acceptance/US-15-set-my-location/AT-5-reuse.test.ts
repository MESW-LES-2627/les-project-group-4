import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room } from '@/api/types'
import { GET } from '@/app/api/rooms/[id]/route'
import {
  getRoomCoordinates,
  loadLastLocation,
  parseSavedLocation,
  resolveRoomLocation,
  toLocationInput,
} from '@/lib/location'
import { roomLocationSchema } from '@/lib/schemas/room'

const { findRoom } = vi.hoisted(() => ({ findRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { findUnique: findRoom } }),
}))

const porto = { id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 }
const noLocation = { city: null, latitude: null, longitude: null }
const withCity = { ...noLocation, city: porto }
const withCoordinates = { city: null, latitude: 41.15, longitude: -8.61 }

const room: Room = {
  id: 3,
  name: 'Living room',
  widthCm: 450,
  lengthCm: 500,
  city: porto,
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
  'AT-5 — Reuse: a saved location is reused when the room is reopened',
  { tags: ['acceptance', 'US-15', 'AT-5'] },
  () => {
    it("uses the city's coordinates", () => {
      expect(getRoomCoordinates(withCity)).toEqual({
        latitude: 41.1579,
        longitude: -8.6291,
      })
    })

    it('uses the saved browser coordinates', () => {
      expect(getRoomCoordinates(withCoordinates)).toEqual({
        latitude: 41.15,
        longitude: -8.61,
      })
    })

    it('returns null when the room has no location', () => {
      expect(getRoomCoordinates(noLocation)).toBeNull()
    })

    it("turns a city into its id for the next room's location", () => {
      expect(toLocationInput(withCity)).toEqual({ cityId: 1 })
    })

    it('keeps browser coordinates for the next room', () => {
      expect(toLocationInput(withCoordinates)).toEqual({ latitude: 41.15, longitude: -8.61 })
    })

    it('gives no location for a room without one', () => {
      expect(toLocationInput(noLocation)).toEqual({})
    })

    it('reads a saved city or saved coordinates', () => {
      expect(parseSavedLocation('{"cityId":1}')).toEqual({ cityId: 1 })
      expect(parseSavedLocation('{"latitude":41.15,"longitude":-8.61}')).toEqual({
        latitude: 41.15,
        longitude: -8.61,
      })
    })

    it.each([
      ['nothing saved', null],
      ['not JSON', '{ nope'],
      ['a bad city id', '{"cityId":-1}'],
      ['only a latitude', '{"latitude":41}'],
      ['a latitude out of range', '{"latitude":91,"longitude":0}'],
      ['a city and coordinates', '{"cityId":1,"latitude":41,"longitude":-8}'],
      ['a city id too big for the database', '{"cityId":2147483648}'],
      ['an unknown field', '{"cityId":1,"extra":true}'],
    ])('gives no location for %s', (_label, raw) => {
      expect(parseSavedLocation(raw)).toEqual({})
    })

    it('rounds saved coordinates like the API does', () => {
      expect(parseSavedLocation('{"latitude":41.157899,"longitude":-8.629101}')).toEqual({
        latitude: 41.158,
        longitude: -8.629,
      })
    })

    it('prefers the city, then the coordinates, then none', () => {
      const city = { id: 1, name: 'Porto', latitude: 41.15, longitude: -8.61 }
      expect(resolveRoomLocation({ city, latitude: null, longitude: null })).toEqual({
        kind: 'city',
        city,
      })
      expect(resolveRoomLocation({ city: null, latitude: 41.1, longitude: -8.6 })).toEqual({
        kind: 'coordinates',
        latitude: 41.1,
        longitude: -8.6,
      })
      expect(resolveRoomLocation({ city: null, latitude: null, longitude: null })).toEqual({
        kind: 'none',
      })
    })

    it('treats half a pair of coordinates as no location', () => {
      expect(resolveRoomLocation({ city: null, latitude: 41.1, longitude: null })).toEqual({
        kind: 'none',
      })
    })

    it('gives no last location instead of throwing when storage is unavailable', () => {
      // Vitest runs in Node, where there is no window.localStorage.
      expect(loadLastLocation()).toEqual({})
    })

    it.each([
      ['no location', {}],
      ['a city', { cityId: 1 }],
      ['coordinates', { latitude: 41.15, longitude: -8.61 }],
    ])('the remembered location accepts %s', (_label, location) => {
      expect(roomLocationSchema.parse(location)).toEqual(location)
    })

    it.each([
      ['a city and coordinates', { cityId: 1, latitude: 41, longitude: -8 }],
      ['only a longitude', { longitude: -8 }],
      ['a city id above the database limit', { cityId: 2_147_483_648 }],
      ['an unknown field', { cityId: 1, name: 'Porto' }],
    ])('the remembered location rejects %s, like POST /api/rooms', (_label, location) => {
      expect(roomLocationSchema.safeParse(location).success).toBe(false)
    })

    it('returns the saved location when the room is reopened', async () => {
      const coordinates = { latitude: 41.15, longitude: -8.61 }
      findRoom.mockResolvedValue({ ...room, city: null, ...coordinates } as never)

      const body = (await (await get('3')).json()) as Room

      expect(body.city).toBeNull()
      expect({ latitude: body.latitude, longitude: body.longitude }).toEqual(coordinates)
    })
  },
)
