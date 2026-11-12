import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LayoutDetails, LayoutSummary, ValidationErrorBody } from '@/api/types'
import { DUPLICATE_LAYOUT_NAME } from '@/lib/schemas/layout'

import { GET, POST } from './route'

const { findRoom, findItems, findLayouts, createLayout } = vi.hoisted(() => ({
  findRoom: vi.fn(),
  findItems: vi.fn(),
  findLayouts: vi.fn(),
  createLayout: vi.fn(),
}))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    room: { findUnique: findRoom },
    item: { findMany: findItems },
    layout: { findMany: findLayouts, create: createLayout },
  }),
}))

const savedAt = new Date('2026-11-11T18:00:00.000Z')
const sofa = { catalogItemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90 }
const validBody = { name: 'Cosy corner', items: [sofa] }

/** What Prisma returns for the saved layout (LAYOUT_DETAILS_SELECT). */
const savedRow = {
  id: 7,
  roomId: 3,
  name: 'Cosy corner',
  createdAt: savedAt,
  updatedAt: savedAt,
  items: [
    {
      id: 11,
      xCm: 120,
      yCm: 45.5,
      rotationDeg: 90,
      priceCents: 49900,
      item: { id: 4, name: 'Sofa', widthCm: 200, depthCm: 90 },
    },
  ],
}

const savedLayout: LayoutDetails = {
  id: 7,
  roomId: 3,
  name: 'Cosy corner',
  createdAt: savedAt.toISOString(),
  updatedAt: savedAt.toISOString(),
  items: [
    {
      id: 11,
      catalogItemId: 4,
      name: 'Sofa',
      widthCm: 200,
      depthCm: 90,
      priceCents: 49900,
      xCm: 120,
      yCm: 45.5,
      rotationDeg: 90,
    },
  ],
}

/** Calls a handler the way Next.js does: `params` is a Promise. */
function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

function post(body: unknown, id = '3') {
  const request = new Request(`http://localhost/api/rooms/${id}/layouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  return POST(request, context(id))
}

function get(id = '3') {
  return GET(new Request(`http://localhost/api/rooms/${id}/layouts`), context(id))
}

beforeEach(() => {
  for (const mock of [findRoom, findItems, findLayouts, createLayout]) mock.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
  findRoom.mockResolvedValue({ id: 3 })
  findItems.mockResolvedValue([{ id: 4, priceCents: 49900 }])
})

describe('POST /api/rooms/[id]/layouts', () => {
  describe('US-13 AT-2: persist items', () => {
    it('returns 201 with the saved layout and its items', async () => {
      createLayout.mockResolvedValue(savedRow)

      const response = await post(validBody)

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual(savedLayout)
    })

    it('saves every item with its x, y and rotation under the room', async () => {
      createLayout.mockResolvedValue(savedRow)

      await post(validBody)

      const { data } = createLayout.mock.calls[0][0]
      expect(data).toMatchObject({ roomId: 3, name: 'Cosy corner' })
      expect(data.items.create).toEqual([
        { itemId: 4, xCm: 120, yCm: 45.5, rotationDeg: 90, priceCents: 49900 },
      ])
    })

    it('copies the price from the catalog, not from the request', async () => {
      createLayout.mockResolvedValue(savedRow)
      findItems.mockResolvedValue([{ id: 4, priceCents: 12345 }])

      await post(validBody)

      expect(createLayout.mock.calls[0][0].data.items.create[0].priceCents).toBe(12345)
    })
  })

  describe('US-13 AT-1 / AT-4: validation', () => {
    it.each(['', '   '])('returns 400 for the blank name %j and saves nothing', async (name) => {
      const response = await post({ ...validBody, name })
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors.name).toBe('is required')
      expect(createLayout).not.toHaveBeenCalled()
    })

    it('returns 400 for invalid JSON', async () => {
      const response = await post('{not json')

      expect(response.status).toBe(400)
      expect(((await response.json()) as ValidationErrorBody).errors.body).toBeDefined()
    })

    it('returns 400 when a catalog item does not exist', async () => {
      findItems.mockResolvedValue([])

      const response = await post(validBody)
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(400)
      expect(body.errors.items).toMatch(/4 does not exist/)
      expect(createLayout).not.toHaveBeenCalled()
    })

    it.each(['abc', '0', '01'])('returns 400 for the malformed room id "%s"', async (id) => {
      const response = await post(validBody, id)

      expect(response.status).toBe(400)
      expect(findRoom).not.toHaveBeenCalled()
    })
  })

  it('returns 404 when the room does not exist', async () => {
    findRoom.mockResolvedValue(null)

    const response = await post(validBody, '999')

    expect(response.status).toBe(404)
    expect(createLayout).not.toHaveBeenCalled()
  })

  describe('US-13 AT-6: unique name', () => {
    it('returns 409 with the duplicate-name message when the room already has that name', async () => {
      createLayout.mockRejectedValue(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }))

      const response = await post(validBody)
      const body = (await response.json()) as ValidationErrorBody

      expect(response.status).toBe(409)
      expect(body.errors.name).toBe(DUPLICATE_LAYOUT_NAME)
    })
  })

  describe('US-13 AT-5: failure', () => {
    it('returns 500 without leaking the error when the database throws', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      createLayout.mockRejectedValue(new Error('connection refused'))

      const response = await post(validBody)
      const text = await response.text()

      expect(response.status).toBe(500)
      expect(text).not.toContain('connection refused')
      expect(consoleError).toHaveBeenCalled()
    })
  })
})

describe('GET /api/rooms/[id]/layouts', () => {
  describe('US-14 AT-1: list saved layouts', () => {
    it('returns 200 with each layout by name, its item count and when it was saved', async () => {
      findLayouts.mockResolvedValue([
        { id: 2, name: 'Bright', updatedAt: savedAt, _count: { items: 3 } },
        { id: 7, name: 'Cosy corner', updatedAt: savedAt, _count: { items: 1 } },
      ])

      const response = await get()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([
        { id: 2, name: 'Bright', itemCount: 3, updatedAt: savedAt.toISOString() },
        { id: 7, name: 'Cosy corner', itemCount: 1, updatedAt: savedAt.toISOString() },
      ] satisfies LayoutSummary[])
      expect(findLayouts).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomId: 3 },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
        }),
      )
    })
  })

  describe('US-14 AT-4: empty', () => {
    it('returns 200 with an empty array when the room has no saved layouts', async () => {
      findLayouts.mockResolvedValue([])

      const response = await get()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([])
    })
  })

  it('returns 404 when the room does not exist', async () => {
    findRoom.mockResolvedValue(null)

    const response = await get('999')

    expect(response.status).toBe(404)
    expect(findLayouts).not.toHaveBeenCalled()
  })

  it('returns 400 for a malformed room id', async () => {
    const response = await get('abc')

    expect(response.status).toBe(400)
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    findLayouts.mockRejectedValue(new Error('connection refused'))

    const response = await get()

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('connection refused')
  })
})
