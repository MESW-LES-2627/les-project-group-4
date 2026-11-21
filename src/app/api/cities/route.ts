import { serverError } from '@/app/api/response'
import { findCities } from '@/features/locations/server/cities'

/** US-15: the seeded cities, A to Z. 200 with an array (possibly empty), 500 if the database fails. */
export async function GET() {
  try {
    const cities = await findCities()
    return Response.json(cities)
  } catch (error) {
    return serverError(
      'Failed to list cities',
      'Could not load the cities. Please try again later.',
      error,
    )
  }
}
