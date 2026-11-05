import type { Room } from '@/api/types'
import { formatRoomLocation, resolveRoomLocation } from '@/lib/location'
import { COORDINATE_DECIMALS } from '@/lib/schemas/room'

/** US-03: one room's details. US-15: with its saved location (AT-5: reused when reopened). */
export function RoomDetails({ room }: { room: Room }) {
  const label = formatRoomLocation(room)
  const location = resolveRoomLocation(room)

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
            {label ?? 'Not set'}
            {location.kind === 'coordinates' ? (
              <span className="block text-sm font-normal text-muted-foreground">
                {location.latitude.toFixed(COORDINATE_DECIMALS)},{' '}
                {location.longitude.toFixed(COORDINATE_DECIMALS)}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>
    </div>
  )
}
