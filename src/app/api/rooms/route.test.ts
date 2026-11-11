import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { City, Room } from '@/api/types'

import { GET, POST } from './route'

const { createRoom, findRooms, findCity } = vi.hoisted(() => ({
  createRoom: vi.fn(),
  findRooms: vi.fn(),
  findCity: vi.fn(),
}))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { create: createRoom, findMany: findRooms },
    city: { findUnique: findCity },
  }),
}))

const validBody = { name: 'Bedroom', widthCm: 300, lengthCm: 400 }
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
  findRooms.mockReset()
  findCity.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('POST /api/rooms error handling', () => {
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

describe('GET /api/rooms', () => {
  it('returns 200 with every room', async () => {
    const rooms = [
      { id: 2, name: 'Office', widthCm: 250, lengthCm: 300, ...noLocation, city: porto },
      { id: 1, ...validBody, ...noLocation },
    ]
    findRooms.mockResolvedValue(rooms as never)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(rooms)
  })

  it('asks the database for the newest rooms first', async () => {
    findRooms.mockResolvedValue([] as never)

    await GET()

    expect(findRooms).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
    )
  })

  it('returns 200 with an empty array when there are no rooms', async () => {
    findRooms.mockResolvedValue([] as never)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    findRooms.mockRejectedValue(new Error('connection refused'))

    const response = await GET()
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toContain('connection refused')
    expect(consoleError).toHaveBeenCalled()
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
    city: null,
    latitude: null,
    longitude: null,
  } satisfies Record<keyof Room, unknown>

  it('GET items have exactly the Room fields', async () => {
    findRooms.mockResolvedValue([{ id: 7, ...validBody, ...noLocation }] as never)

    const body: unknown = await (await GET()).json()

    expect(body).toEqual([roomShape])
  })

  it('a room with a city has the City fields inside it', async () => {
    findRooms.mockResolvedValue([{ id: 7, ...validBody, ...noLocation, city: porto }] as never)

    const body: unknown = await (await GET()).json()

    expect(body).toEqual([
      {
        ...roomShape,
        city: {
          id: expect.any(Number),
          name: expect.any(String),
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        } satisfies Record<keyof City, unknown>,
      },
    ])
  })
})