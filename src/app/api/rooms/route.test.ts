import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room, ValidationErrorBody } from '@/api/types'
import { db } from '@/lib/db'

import { POST } from './route'

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  db: { room: { create: vi.fn() } },
}))

const createRoom = vi.mocked(db.room.create)

const validBody = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  createRoom.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('POST /api/rooms', () => {
  it('returns 201 with the created room and saves the parsed data', async () => {
    createRoom.mockResolvedValue({ id: 1, ...validBody } as never)

    const response = await POST(postRequest(validBody))

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ id: 1, ...validBody })
    expect(createRoom).toHaveBeenCalledWith(expect.objectContaining({ data: validBody }))
  })

  it('returns 400 with field errors and does not touch the database', async () => {
    const response = await POST(postRequest({ ...validBody, widthCm: -5 }))
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

  it('returns 500 without leaking the error when the database throws', async () => {
    // The route logs the real error on the server; catch that log so it is not
    // printed during the test run (it looks like a failure, but it is expected).
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    createRoom.mockRejectedValue(new Error('connection refused'))

    const response = await POST(postRequest(validBody))
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toContain('connection refused')
    expect(text).not.toMatch(/\bat \S+:\d+:\d+/) // no stack-trace lines
    expect(consoleError).toHaveBeenCalled() // the details were logged on the server
  })
})

describe('response shape matches src/api/types.ts', () => {
  // `satisfies` makes TypeScript fail if Room gains, loses or renames a field,
  // so this expected shape can never drift away from src/api/types.ts.
  const roomShape = {
    id: expect.any(Number),
    name: expect.any(String),
    widthCm: expect.any(Number),
    lengthCm: expect.any(Number),
  } satisfies Record<keyof Room, unknown>

  it('201 body has exactly the Room fields with the right types', async () => {
    createRoom.mockResolvedValue({ id: 7, ...validBody } as never)

    const body: unknown = await (await POST(postRequest(validBody))).json()

    expect(body).toEqual(roomShape) // toEqual also fails on extra fields
  })

  it('400 body is { errors: { field: message } }', async () => {
    const body = (await (await POST(postRequest({ name: '' }))).json()) as ValidationErrorBody

    expect(Object.keys(body)).toEqual(['errors'])
    for (const message of Object.values(body.errors)) {
      expect(typeof message).toBe('string')
    }
  })
})