import { describe, expect, it } from 'vitest'

import { roomIdSchema } from './schema'

describe('roomIdSchema', () => {
  it('turns a positive whole number into a number', () => {
    expect(roomIdSchema.safeParse('42')).toEqual({ success: true, data: 42 })
  })

  it.each(['', 'abc', '0', '-1', '1.5', '01', ' 1', '2147483648'])('rejects "%s"', (id) => {
    expect(roomIdSchema.safeParse(id).success).toBe(false)
  })
})
