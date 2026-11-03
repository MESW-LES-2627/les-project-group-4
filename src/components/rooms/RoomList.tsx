import Link from 'next/link'

import type { Room } from '@/api/types'
import { Button } from '@/components/ui/button'
import { formatRoomLocation } from '@/lib/location'

/** US-02: the saved rooms, newest first, or an empty state when there are none. US-15: with their location. */
export function RoomList({ rooms }: { rooms: Room[] }) {
  if (rooms.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border p-6">
        <p className="text-sm text-muted-foreground">You have not created any rooms yet.</p>
        <Button asChild>
          <Link href="/">Create your first room</Link>
        </Button>
      </div>
    )
  }

  return (
    <ul className="grid gap-2">
      {rooms.map((room) => {
        const location = formatRoomLocation(room)
        return (
          <li key={room.id}>
            <Link
              href={`/rooms/${room.id}`}
              className="grid gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="font-medium break-words text-foreground">{room.name}</span>
              <span className="text-sm text-muted-foreground">
                {room.widthCm} × {room.lengthCm} cm
                {location !== null ? ` · ${location}` : null}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
