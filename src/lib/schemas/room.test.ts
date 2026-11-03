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

describe('roomIdSchema', () => {
  it('turns a positive whole number into a number', () => {
    expect(roomIdSchema.safeParse('42')).toEqual({ success: true, data: 42 })
  })

  it.each(['', 'abc', '0', '-1', '1.5', '01', ' 1', '2147483648'])('rejects "%s"', (id) => {
    expect(roomIdSchema.safeParse(id).success).toBe(false)
  })
})
