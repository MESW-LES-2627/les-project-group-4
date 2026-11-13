import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '@/api/types'
import { POST } from '@/app/api/rooms/route'
import { CURRENT_LOCATION_LABEL, formatRoomLocation } from '@/lib/location'
import { pickLocationError, toCreateRoomRequest } from '@/lib/roomValidation'
import { createRoomSchema, roundCoordinate } from '@/lib/schemas/room'

const { createRoom } = vi.hoisted(() => ({ createRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { create: createRoom },
    city: { findUnique: vi.fn() },
  }),
}))

const validBody = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }
const formValues = { name: ' Bedroom ', width: '300', length: '400' }
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
  vi.restoreAllMocks()
})

describe(
  'AT-2 — Geolocation: the coordinates are stored and the unknown city is "Current location"',
  { tags: ['acceptance', 'US-15', 'AT-2'] },
  () => {
    it('shows "Current location" for coordinates without a city', () => {
      expect(
        formatRoomLocation({ city: null, latitude: coordinates.latitude, longitude: coordinates.longitude }),
      ).toBe(CURRENT_LOCATION_LABEL)
      expect(CURRENT_LOCATION_LABEL).toBe('Current location')
    })

    it('accepts browser coordinates, including the limits', () => {
      expect(
        createRoomSchema.safeParse({ ...validBody, ...coordinates }).success,
      ).toBe(true)
      expect(
        createRoomSchema.safeParse({ ...validBody, latitude: -90, longitude: 180 }).success,
      ).toBe(true)
    })

    it.each([
      ['latitude above 90', { latitude: 90.1, longitude: 0 }, 'latitude'],
      ['latitude below -90', { latitude: -90.1, longitude: 0 }, 'latitude'],
      ['longitude above 180', { latitude: 0, longitude: 180.1 }, 'longitude'],
      ['longitude below -180', { latitude: 0, longitude: -180.1 }, 'longitude'],
      ['a string latitude', { latitude: '41', longitude: 0 }, 'latitude'],
      ['latitude without longitude', { latitude: 41 }, 'longitude'],
      ['longitude without latitude', { longitude: -8 }, 'latitude'],
      ['a city and coordinates', { cityId: 1, latitude: 41, longitude: -8 }, 'cityId'],
    ])('rejects %s', (_label, location, field) => {
      const result = createRoomSchema.safeParse({ ...validBody, ...location })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toEqual([field])
    })

    it('keeps 3 decimals (about 110 m) of the browser coordinates', () => {
      const parsed = createRoomSchema.parse({
        ...validBody,
        latitude: 41.177851,
        longitude: -8.596074,
      })

      expect(parsed.latitude).toBe(41.178)
      expect(parsed.longitude).toBe(-8.596)
    })

    it.each([
      [41.1775, 41.178],
      [-8.5965, -8.596],
      [90, 90],
      [-180, -180],
    ])('rounds %f to %f', (value, rounded) => {
      expect(roundCoordinate(value)).toBe(rounded)
    })

    it('never returns -0', () => {
      expect(Object.is(roundCoordinate(-0.0001), 0)).toBe(true)
    })

    it('checks the range before rounding, so 90.0004 is still rejected', () => {
      expect(
        createRoomSchema.safeParse({ ...validBody, latitude: 90.0004, longitude: 0 }).success,
      ).toBe(false)
    })

    it('sends the browser coordinates from the form', () => {
      expect(toCreateRoomRequest(formValues, coordinates)).toMatchObject(coordinates)
    })

    it('stores the browser coordinates on POST /api/rooms', async () => {
      createRoom.mockResolvedValue({
        id: 1,
        ...validBody,
        city: null,
        ...coordinates,
      } as never)

      const response = await POST(postRequest({ ...validBody, ...coordinates }))

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual({
        id: 1,
        ...validBody,
        city: null,
        ...coordinates,
      })
      expect(createRoom).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ...validBody, ...coordinates } }),
      )
    })

    it('saves the coordinates rounded to 3 decimals', async () => {
      createRoom.mockResolvedValue({
        id: 1,
        ...validBody,
        city: null,
        latitude: 41.178,
        longitude: -8.596,
      } as never)

      await POST(postRequest({ ...validBody, latitude: 41.177851, longitude: -8.596074 }))

      expect(createRoom).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ...validBody, latitude: 41.178, longitude: -8.596 } }),
      )
    })

    it('returns 400 when a city and coordinates are both sent', async () => {
      const response = await POST(
        postRequest({ ...validBody, cityId: 1, ...coordinates }),
      )
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors).toHaveProperty('cityId')
      expect(createRoom).not.toHaveBeenCalled()
    })

    it('returns 400 for a latitude out of range', async () => {
      const response = await POST(postRequest({ ...validBody, latitude: 91, longitude: 0 }))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors).toHaveProperty('latitude')
      expect(createRoom).not.toHaveBeenCalled()
    })

    it('turns rejected coordinates into a message for the location field', () => {
      expect(pickLocationError({ latitude: 'must be between -90 and 90' })).toMatch(
        /could not be saved/,
      )
      expect(pickLocationError({ longitude: 'is required with latitude' })).toMatch(
        /could not be saved/,
      )
    })
  },
)
