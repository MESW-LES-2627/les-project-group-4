import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ValidationErrorBody } from '@/lib/http'
import { POST } from '@/app/api/rooms/route'
import { createRoomSchema } from '@/lib/schemas/room'

const { createRoom } = vi.hoisted(() => ({ createRoom: vi.fn() }))

vi.mock('@/lib/db', () => ({
  getDb: () => ({ room: { create: createRoom } }),
}))

const validRoom = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }

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
  'AT-2 — Validation: invalid input is rejected with a clear message',
  { tags: ['acceptance', 'US-01', 'AT-2'] },
  () => {
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

    it('returns 400 with field errors and does not touch the database', async () => {
      const response = await POST(postRequest({ ...validRoom, widthCm: -5 }))
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors).toHaveProperty('widthCm')
      expect(typeof body.errors.widthCm).toBe('string')
      expect(createRoom).not.toHaveBeenCalled()
    })

    it('returns 400 for malformed JSON', async () => {
      const response = await POST(postRequest('{ not json'))

      expect(response.status).toBe(400)
      expect(createRoom).not.toHaveBeenCalled()
    })

    it('the 400 body is { errors: { field: message } }', async () => {
      const body = (await (await POST(postRequest({ name: '' }))).json()) as ValidationErrorBody

      expect(Object.keys(body)).toEqual(['errors'])
      for (const message of Object.values(body.errors)) {
        expect(typeof message).toBe('string')
      }
    })
  },
)
