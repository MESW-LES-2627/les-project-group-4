import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room } from '@/api/types'
import type { ValidationErrorBody } from '@/lib/http'
import { POST } from '@/app/api/rooms/route'
import { formatRoomLocation } from '@/lib/location'
import { pickLocationError, toCreateRoomRequest } from '@/lib/roomValidation'
import { createRoomSchema } from '@/lib/schemas/room'

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
const formValues = { name: ' Bedroom ', width: '300', length: '400' }
const noLocation = { city: null, latitude: null, longitude: null }
const porto = { id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 }

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
  'AT-1 — City: choosing "Porto" stores Porto as the room city',
  { tags: ['acceptance', 'US-15', 'AT-1'] },
  () => {
    it('shows the city name for a room with a city', () => {
      expect(formatRoomLocation({ ...noLocation, city: porto })).toBe('Porto')
    })

    it('shows no location for a room without one', () => {
      expect(formatRoomLocation(noLocation)).toBeNull()
    })

    it('accepts a city id in the create payload', () => {
      expect(createRoomSchema.safeParse({ ...validBody, cityId: porto.id }).success).toBe(true)
    })

    it.each([
      ['a string', '1'],
      ['zero', 0],
      ['negative', -1],
      ['a decimal', 1.5],
      ['too large', 2_147_483_648],
    ])('rejects a cityId that is %s', (_label, cityId) => {
      const result = createRoomSchema.safeParse({ ...validBody, cityId })

      expect(result.success).toBe(false)
    })

    it('sends no location fields when none was chosen', () => {
      expect(toCreateRoomRequest(formValues)).toEqual({
        name: 'Bedroom',
        widthCm: 300,
        lengthCm: 400,
      })
    })

    it('sends the chosen city from the form', () => {
      expect(toCreateRoomRequest(formValues, { cityId: porto.id })).toEqual({
        name: 'Bedroom',
        widthCm: 300,
        lengthCm: 400,
        cityId: porto.id,
      })
    })

    it('returns null when the form is invalid, whatever the location', () => {
      expect(toCreateRoomRequest({ ...formValues, width: '0' }, { cityId: porto.id })).toBeNull()
    })

    it('stores the chosen city on POST /api/rooms', async () => {
      findCity.mockResolvedValue({ id: porto.id } as never)
      createRoom.mockResolvedValue({ id: 1, ...validBody, ...noLocation, city: porto } as never)

      const response = await POST(postRequest({ ...validBody, cityId: porto.id }))

      expect(response.status).toBe(201)
      expect(((await response.json()) as Room).city).toEqual(porto)
      expect(findCity).toHaveBeenCalledWith(expect.objectContaining({ where: { id: porto.id } }))
      expect(createRoom).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ...validBody, cityId: porto.id } }),
      )
    })

    it('returns 400 for a city that does not exist and does not create the room', async () => {
      findCity.mockResolvedValue(null)

      const response = await POST(postRequest({ ...validBody, cityId: 999 }))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors).toEqual({ cityId: 'does not exist' })
      expect(createRoom).not.toHaveBeenCalled()
    })

    it.each([
      ['a string', '1'],
      ['zero', 0],
      ['a decimal', 1.5],
    ])('returns 400 for a cityId that is %s without touching the database', async (_label, cityId) => {
      const response = await POST(postRequest({ ...validBody, cityId }))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors).toHaveProperty('cityId')
      expect(findCity).not.toHaveBeenCalled()
      expect(createRoom).not.toHaveBeenCalled()
    })

    it('turns an unknown city into a message for the location field', () => {
      expect(pickLocationError({ cityId: 'does not exist' })).toBe(
        'That city is no longer available. Choose another location.',
      )
    })

    it('keeps any other city message', () => {
      expect(pickLocationError({ cityId: 'choose a city or your current location, not both' })).toBe(
        'Location: choose a city or your current location, not both.',
      )
    })

    it('gives nothing when only the name or dimensions failed', () => {
      expect(pickLocationError({ name: 'is required', widthCm: 'must be positive' })).toBeUndefined()
      expect(pickLocationError({})).toBeUndefined()
    })
  },
)
