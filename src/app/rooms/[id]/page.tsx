import type { Metadata } from 'next'
import Link from 'next/link'

import { RoomDetails } from '@/components/rooms/RoomDetails'

export const metadata: Metadata = {
  title: 'FurniMi - Room',
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-2xl content-start gap-6">
        <Link href="/rooms" className="text-sm text-muted-foreground hover:text-foreground">
          ← My rooms
        </Link>
        <RoomDetails key={id} id={id} />
      </section>
    </main>
  )
}
