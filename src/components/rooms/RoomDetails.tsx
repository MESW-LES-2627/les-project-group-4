import type { Room } from '@/api/types'
import { RoomPlan } from '@/components/plan/RoomPlan'
import { formatRoomLocation, resolveRoomLocation } from '@/lib/location'
import { COORDINATE_DECIMALS } from '@/lib/schemas/room'

/** 400 × 300 cm becomes 12 m². */
function formatArea(room: Room) {
  const area = (room.widthCm * room.lengthCm) / 10_000
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(area)} m²`
}

/** US-03: one room's details, including the 2D plan. US-15: with its saved location. */
export function RoomDetails({ room }: { room: Room }) {
  const summary = `${room.widthCm} × ${room.lengthCm} cm · ${formatArea(room)}`
  const label = formatRoomLocation(room)
  const location = resolveRoomLocation(room)

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight wrap-break-word text-foreground sm:text-3xl">
          {room.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {label !== null ? `${summary} · ${label}` : summary}
        </p>
        {location.kind === 'coordinates' ? (
          <p className="text-sm text-muted-foreground">
            {location.latitude.toFixed(COORDINATE_DECIMALS)},{' '}
            {location.longitude.toFixed(COORDINATE_DECIMALS)}
          </p>
        ) : null}
      </header>

      <section aria-label="2D plan">
        <RoomPlan room={room} />
      </section>
    </div>
  )
}
