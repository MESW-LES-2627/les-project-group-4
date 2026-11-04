import type { Room } from '@/api/types'
import { formatRoomLocation, getRoomCoordinates } from '@/lib/location'

/** US-03: one room's details. US-15: with its saved location (AT-5: reused when reopened). */
export function RoomDetails({ room }: { room: Room }) {
  const location = formatRoomLocation(room)
  const coordinates = getRoomCoordinates(room)

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight break-words text-foreground">
        {room.name}
      </h1>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Width</dt>
          <dd className="font-medium text-foreground">{room.widthCm} cm</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Length</dt>
          <dd className="font-medium text-foreground">{room.lengthCm} cm</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Location</dt>
          <dd className="font-medium text-foreground">
            {location ?? 'Not set'}
            {coordinates !== null && room.city === null ? (
              <span className="block text-sm font-normal text-muted-foreground">
                {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>
    </div>
  )
}
