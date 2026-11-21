import Link from 'next/link'
import { ChevronRight, DoorOpen, MapPin, Plus, Ruler, SquareDashed } from 'lucide-react'

import type { Room } from '@/features/rooms/types'
import { Button } from '@/components/ui/button'
import { RoomThumbnail } from '@/features/rooms/components/RoomThumbnail'
import { formatRoomLocation } from '@/features/locations/model/location'
import { formatArea } from '@/features/rooms/model/roomFormat'

/** US-02: the saved rooms, newest first, or an empty state when there are none. */
export function RoomList({ rooms }: { rooms: Room[] }) {
  if (rooms.length === 0) {
    return (
      <div className="mt-6 grid justify-items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
          <DoorOpen className="size-5" aria-hidden="true" />
        </span>
        <div className="grid gap-1">
          <p className="font-medium text-foreground">No rooms yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Create your first room and FurniMi will help you plan what fits.
          </p>
        </div>
        <Button asChild>
          <Link href="/rooms/new">
            <Plus aria-hidden="true" />
            Create your first room
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link
            href={`/rooms/${room.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <RoomThumbnail room={room} />
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-medium break-words text-foreground">{room.name}</h2>
                <ChevronRight
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Ruler className="size-3 shrink-0" aria-hidden="true" />
                  <dt className="sr-only">Dimensions</dt>
                  <dd>
                    {room.widthCm} × {room.lengthCm} cm
                  </dd>
                </div>
                <div className="flex items-center gap-1">
                  <SquareDashed className="size-3 shrink-0" aria-hidden="true" />
                  <dt className="sr-only">Area</dt>
                  <dd>{formatArea(room)}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  <dt className="sr-only">Location</dt>
                  <dd>{formatRoomLocation(room) ?? 'No location'}</dd>
                </div>
              </dl>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
