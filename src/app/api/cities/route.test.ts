import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { City } from '@/features/locations/types'

import { GET } from './route'

const { findCities } = vi.hoisted(() => ({ findCities: vi.fn() }))

// Replace the real Prisma client with a fake: no database is needed.
vi.mock('@/lib/db', () => ({
  getDb: () => ({ city: { findMany: findCities } }),
}))

const cities: City[] = [
  { id: 2, name: 'Lisboa', latitude: 38.7223, longitude: -9.1393 },
  { id: 1, name: 'Porto', latitude: 41.1579, longitude: -8.6291 },
]

beforeEach(() => {
  findCities.mockReset()
  vi.restoreAllMocks() // undo any vi.spyOn from the previous test (e.g. console.error)
})

describe('GET /api/cities', () => {
  it('returns 200 with every city', async () => {
    findCities.mockResolvedValue(cities as never)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(cities)
  })

  it('asks the database for the cities A to Z', async () => {
    findCities.mockResolvedValue([] as never)

    await GET()

    expect(findCities).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
    )
  })

  it('puts accented names in Portuguese alphabetical order', async () => {
    const city = (id: number, name: string) => ({ id, name, latitude: 0, longitude: 0 })
    // What the database returns with its default collation: accented letters last.
    findCities.mockResolvedValue([city(1, 'Coimbra'), city(2, 'Faro'), city(3, 'Évora')] as never)

    const response = await GET()

    const names = ((await response.json()) as { name: string }[]).map((c) => c.name)
    expect(names).toEqual(['Coimbra', 'Évora', 'Faro'])
  })

  it('returns 200 with an empty array when there are no cities', async () => {
    findCities.mockResolvedValue([] as never)

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns 500 without leaking the error when the database throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    findCities.mockRejectedValue(new Error('connection refused'))

    const response = await GET()
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(text).not.toContain('connection refused')
    expect(consoleError).toHaveBeenCalled()
  })

  it('items have exactly the City fields (src/api/types.ts)', async () => {
    findCities.mockResolvedValue([cities[0]] as never)

    const body: unknown = await (await GET()).json()

    expect(body).toEqual([
      {
        id: expect.any(Number),
        name: expect.any(String),
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      } satisfies Record<keyof City, unknown>,
    ])
  })
})
