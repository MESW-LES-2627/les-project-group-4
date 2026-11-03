import type { Metadata } from 'next'
import { connection } from 'next/server'

import { RoomList } from '@/components/rooms/RoomList'
import { findRooms } from '@/lib/rooms'

export const metadata: Metadata = {
  title: 'FurniMi - My rooms',
}

/** US-02: loads the rooms on the server; loading.tsx and error.tsx cover the other states. */
export default async function RoomsPage() {
  // Render on every request, never at build time, so the list is always current.
  await connection()
  const rooms = await findRooms()

  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-2xl content-start gap-6"
        aria-labelledby="rooms-heading"
      >
        <h1 id="rooms-heading" className="text-2xl font-bold tracking-tight text-foreground">
          My rooms
        </h1>
        <RoomList rooms={rooms} />
      </section>
    </main>
  )
}
