import { connection } from 'next/server'

import type { City } from '@/api/types'
import { CreateRoomForm } from '@/components/CreateRoomForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { findCities } from '@/lib/cities'

/** US-15: the city list, or none if it cannot be loaded (rooms can still be created). */
async function loadCities(): Promise<City[]> {
  try {
    return await findCities()
  } catch (error) {
    console.error('Failed to load cities', error)
    return []
  }
}

export default async function HomePage() {
  // Render on every request, never at build time, so the city list comes from the database.
  await connection()
  const cities = await loadCities()

  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="m-auto w-full max-w-lg"
        aria-labelledby="create-room-heading"
      >
        <Card className="gap-0 py-6">
          <CardHeader className="gap-2 px-6 pb-5">
            <h1
              id="create-room-heading"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Create a room
            </h1>
            <p className="text-sm text-muted-foreground">
              Add a room's name and its real dimensions so FurniMi can check
              what fits.
            </p>
          </CardHeader>
          <CardContent className="px-6">
            <CreateRoomForm cities={cities} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
