import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RoomDetails } from '@/components/rooms/RoomDetails'
import { findRoomById } from '@/lib/rooms'
import { roomIdSchema } from '@/lib/schemas/room'

export const metadata: Metadata = {
  title: 'FurniMi - Room',
}

/**
 * US-03: loads one room on the server. A malformed id and a missing room both show not-found.tsx;
 * loading.tsx and error.tsx cover the other states.
 */
export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = roomIdSchema.safeParse(id)
  if (!parsed.success) {
    notFound()
  }

  const room = await findRoomById(parsed.data)
  if (room === null) {
    notFound()
  }

  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-2xl content-start gap-6">
        <Link href="/rooms" className="text-sm text-muted-foreground hover:text-foreground">
          ← My rooms
        </Link>
        <RoomDetails room={room} />
      </section>
    </main>
  )
}
