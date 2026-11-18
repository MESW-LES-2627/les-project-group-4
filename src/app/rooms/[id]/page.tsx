import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { RoomDetails } from '@/components/rooms/RoomDetails'
import { findItems } from '@/lib/items'
import { findRoomById } from '@/lib/rooms'
import { listItemsQuerySchema } from '@/lib/schemas/item'
import { roomIdSchema } from '@/lib/schemas/room'

export const metadata: Metadata = {
  title: 'FurniMi - Room',
}

/**
 * US-03: loads one room on the server. A malformed id and a missing room both show not-found.tsx;
 * loading.tsx and error.tsx cover the other states.
 * US-09: also loads the catalog, filtered by ?category=, for the room's add panel.
 */
export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const parsed = roomIdSchema.safeParse(id)
  if (!parsed.success) {
    notFound()
  }

  const { category } = await searchParams
  const catalogQuery = listItemsQuerySchema.safeParse({ category })
  if (!catalogQuery.success) {
    notFound()
  }

  const [room, catalogItems] = await Promise.all([
    findRoomById(parsed.data),
    findItems(catalogQuery.data),
  ])
  if (room === null) {
    notFound()
  }

  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="grid w-full content-start gap-6">
        <div className="mx-auto w-full max-w-4xl">
          <Link
            href="/rooms"
            className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="size-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            My rooms
          </Link>
        </div>
        <RoomDetails
          room={room}
          catalogItems={catalogItems}
          category={catalogQuery.data.category}
        />
      </section>
    </main>
  )
}
