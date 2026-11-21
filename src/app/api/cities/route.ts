import { findCities } from '@/features/locations/server/cities'

/** US-15: the seeded cities, A to Z. 200 with an array (possibly empty), 500 if the database fails. */
export async function GET() {
  try {
    const cities = await findCities()
    return Response.json(cities)
  } catch (error) {
    // Log the details on the server only; the client gets a generic message.
    console.error('Failed to list cities', error)
    return Response.json(
      { message: 'Could not load the cities. Please try again later.' },
      { status: 500 },
    )
  }
}
