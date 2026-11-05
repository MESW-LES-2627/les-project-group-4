import type { Metadata } from 'next'
import { connection } from 'next/server'

import { RoomList } from '@/components/rooms/RoomList'
import { RoomsHeader } from '@/components/rooms/RoomsHeader'
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
        className="mx-auto grid w-full max-w-4xl content-start"
        aria-labelledby="rooms-heading"
      >
        <RoomsHeader count={rooms.length} />
        <RoomList rooms={rooms} />
      </section>
    </main>
  )
}
