import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LayoutDetails, ValidationErrorBody } from '@/api/types'

import { DELETE, GET } from './route'

const { findLayout, deleteLayouts } = vi.hoisted(() => ({
  findLayout: vi.fn(),
  deleteLayouts: vi.fn(),
}))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({ layout: { findFirst: findLayout, deleteMany: deleteLayouts } }),
}))

const savedAt = new Date('2026-11-11T18:00:00.000Z')

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

/** Calls a handler the way Next.js does: `params` is a Promise. */
function context(id: string, layoutId: string) {
  return { params: Promise.resolve({ id, layoutId }) }
}

function get(id = '3', layoutId = '7') {
  return GET(new Request(`http://localhost/api/rooms/${id}/layouts/${layoutId}`), context(id, layoutId))
}

function remove(id = '3', layoutId = '7') {
  return DELETE(
    new Request(`http://localhost/api/rooms/${id}/layouts/${layoutId}`, { method: 'DELETE' }),
    context(id, layoutId),
  )
}

beforeEach(() => {
  findLayout.mockReset()
  deleteLayouts.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('GET /api/rooms/[id]/layouts/[layoutId]', () => {
  describe('US-14 AT-2: restore', () => {
    it('returns 200 with the items, their positions, rotations and saved prices', async () => {
      findLayout.mockResolvedValue(savedRow)

      const response = await get()
      const body = (await response.json()) as LayoutDetails

      expect(response.status).toBe(200)
      expect(body.items).toEqual([
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
      ])
    })

    it('only looks for the layout inside the room from the URL', async () => {
      findLayout.mockResolvedValue(savedRow)

      await get('3', '7')

      expect(findLayout).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 7, roomId: 3 } }),
      )
    })
  })

  describe('US-14 AT-5: missing layout', () => {
    it('returns 404 when the layout does not exist (or belongs to another room)', async () => {
      findLayout.mockResolvedValue(null)

      const response = await get('3', '999')

      expect(response.status).toBe(404)
    })
  })

  it.each([
    ['abc', '7', 'id'],
    ['3', 'abc', 'layoutId'],
    ['3', '0', 'layoutId'],
  ])('returns 400 for the malformed ids %s/%s', async (id, layoutId, field) => {
    const response = await get(id, layoutId)
    const body = (await response.json()) as ValidationErrorBody

    expect(response.status).toBe(400)
    expect(typeof body.errors[field]).toBe('string')
    expect(findLayout).not.toHaveBeenCalled()
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    findLayout.mockRejectedValue(new Error('connection refused'))

    const response = await get()

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('connection refused')
  })
})

describe('DELETE /api/rooms/[id]/layouts/[layoutId]', () => {
  describe('US-14 AT-6: delete saved layout', () => {
    it('returns 204 with no body and deletes only that layout of that room', async () => {
      deleteLayouts.mockResolvedValue({ count: 1 })

      const response = await remove('3', '7')

      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')
      expect(deleteLayouts).toHaveBeenCalledWith({ where: { id: 7, roomId: 3 } })
    })
  })

  it('returns 404 when the layout does not exist in this room', async () => {
    deleteLayouts.mockResolvedValue({ count: 0 })

    const response = await remove('3', '999')

    expect(response.status).toBe(404)
  })

  it('returns 400 for a malformed layout id and deletes nothing', async () => {
    const response = await remove('3', '1.5')

    expect(response.status).toBe(400)
    expect(deleteLayouts).not.toHaveBeenCalled()
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteLayouts.mockRejectedValue(new Error('connection refused'))

    const response = await remove()

    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('connection refused')
  })
})
