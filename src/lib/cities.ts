import type { City } from '@/api/types'
import { getDb } from '@/lib/db'

// The city fields the API returns (see City in src/api/types.ts).
// Also used by ROOM_SELECT, so a room's city has the same shape.
export const CITY_SELECT = { id: true, name: true, latitude: true, longitude: true } as const

// Portuguese alphabetical order, so "Évora" comes after "Coimbra" and not after "Viseu"
// (the database collation sorts accented letters last).
const cityNameOrder = new Intl.Collator('pt', { sensitivity: 'base' })

/** US-15: every seeded city, A to Z. Used by GET /api/cities and the create-room page. */
export async function findCities(): Promise<City[]> {
  const cities = await getDb().city.findMany({
    select: CITY_SELECT,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  })
  return cities.toSorted((a, b) => cityNameOrder.compare(a.name, b.name) || a.id - b.id)
}

/** US-15: true when a city with this id exists. Used to reject an unknown cityId with a 400. */
export async function cityExists(id: number): Promise<boolean> {
  const city = await getDb().city.findUnique({ where: { id }, select: { id: true } })
  return city !== null
}
