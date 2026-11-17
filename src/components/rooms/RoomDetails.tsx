import type { CatalogItem, Room } from '@/api/types'
import { RoomCatalog } from '@/components/catalog/RoomCatalog'
import { RegisterCurrentRoom } from '@/components/layout/RegisterCurrentRoom'
import { RoomPlan } from '@/components/plan/RoomPlan'
import type { ItemCategory } from '@/lib/catalog'
import { formatRoomLocation, resolveRoomLocation } from '@/lib/location'
import { formatArea } from '@/lib/roomFormat'
import { COORDINATE_DECIMALS } from '@/lib/schemas/room'

/**
 * US-03: one room's details, including the 2D plan. US-15: with its saved location.
 * US-09: and the catalog panel that adds items to it.
 */
export function RoomDetails({
  room,
  catalogItems,
  category,
}: {
  room: Room
  catalogItems: CatalogItem[]
  category: ItemCategory | undefined
}) {
  const summary = `${room.widthCm} × ${room.lengthCm} cm · ${formatArea(room)}`
  const label = formatRoomLocation(room)
  const location = resolveRoomLocation(room)

  return (
    <div className="grid gap-6">
      <RegisterCurrentRoom room={room} />
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

      <RoomCatalog room={room} items={catalogItems} category={category} />
    </div>
  )
}
