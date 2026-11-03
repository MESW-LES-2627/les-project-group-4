import { describe, expect, it } from 'vitest'

import { createRoomSchema, roomIdSchema } from './room'

const validRoom = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }

describe('createRoomSchema', () => {
  it('accepts a valid room', () => {
    const result = createRoomSchema.safeParse(validRoom)

    expect(result.success).toBe(true)
  })

  it('rejects a blank name', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, name: '   ' })

    expect(result.success).toBe(false)
  })

  it.each(['name', 'widthCm', 'lengthCm'] as const)('rejects a missing %s', (field) => {
    const room: Record<string, unknown> = { ...validRoom }
    delete room[field]

    const result = createRoomSchema.safeParse(room)

    expect(result.success).toBe(false)
  })

  it.each([
    ['zero', 0],
    ['negative', -5],
    ['non-integer', 2.5],
  ])('rejects a %s width', (_label, widthCm) => {
    const result = createRoomSchema.safeParse({ ...validRoom, widthCm })

    expect(result.success).toBe(false)
  })

  it.each([
    ['zero', 0],
    ['negative', -5],
    ['non-integer', 2.5],
  ])('rejects a %s length', (_label, lengthCm) => {
    const result = createRoomSchema.safeParse({ ...validRoom, lengthCm })

    expect(result.success).toBe(false)
  })
})

describe('createRoomSchema location (US-15)', () => {
  it('accepts a room without a location', () => {
    expect(createRoomSchema.parse(validRoom)).toEqual(validRoom)
  })

  it('accepts a city id', () => {
    expect(createRoomSchema.safeParse({ ...validRoom, cityId: 1 }).success).toBe(true)
  })

  it('accepts browser coordinates, including the limits', () => {
    expect(createRoomSchema.safeParse({ ...validRoom, latitude: 41.15, longitude: -8.61 }).success).toBe(true)
    expect(createRoomSchema.safeParse({ ...validRoom, latitude: -90, longitude: 180 }).success).toBe(true)
  })

  it.each([
    ['a string', '1'],
    ['zero', 0],
    ['negative', -1],
    ['a decimal', 1.5],
    ['too large', 2_147_483_648],
  ])('rejects a cityId that is %s', (_label, cityId) => {
    const result = createRoomSchema.safeParse({ ...validRoom, cityId })

    expect(result.success).toBe(false)
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
    const result = createRoomSchema.safeParse({ ...validRoom, ...location })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual([field])
  })
})

describe('roomIdSchema', () => {
  it('turns a positive whole number into a number', () => {
    expect(roomIdSchema.safeParse('42')).toEqual({ success: true, data: 42 })
  })

  it.each(['', 'abc', '0', '-1', '1.5', '01', ' 1', '2147483648'])('rejects "%s"', (id) => {
    expect(roomIdSchema.safeParse(id).success).toBe(false)
  })
})
