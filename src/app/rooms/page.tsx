import type { Metadata } from 'next'

import { RoomList } from '@/components/rooms/RoomList'

export const metadata: Metadata = {
  title: 'FurniMi - My rooms',
}

export default function RoomsPage() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-2xl content-start gap-6"
        aria-labelledby="rooms-heading"
      >
        <h1 id="rooms-heading" className="text-2xl font-bold tracking-tight text-foreground">
          My rooms
        </h1>
        <RoomList />
      </section>
    </main>
  )
}
