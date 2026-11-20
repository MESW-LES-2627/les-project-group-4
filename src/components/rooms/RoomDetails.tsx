'use client'

import type { CatalogItem, LayoutWithItems, Room } from '@/api/types'
import { RoomCatalog } from '@/components/catalog/RoomCatalog'
import { RegisterCurrentRoom } from '@/components/layout/RegisterCurrentRoom'
import { SaveLayoutForm } from '@/components/layouts/SaveLayoutForm'
import { SavedLayouts } from '@/components/layouts/SavedLayouts'
import { PlacedItemsList } from '@/components/plan/PlacedItemsList'
import { RoomPlan } from '@/components/plan/RoomPlan'
import { useDraftLayouts } from '@/hooks/useDraftLayouts'
import type { ItemCategory } from '@/lib/catalog'
import { formatRoomLocation, resolveRoomLocation } from '@/lib/location'
import { formatArea } from '@/lib/roomFormat'
import { COORDINATE_DECIMALS } from '@/lib/schemas/room'

/**
 * US-03: one room's details, including the 2D plan. US-15: with its saved location.
 * US-09: the placed items, the plan and the catalog form a three-panel editor.
 * US-13b / US-14b: the layouts bar underneath saves the current plan and lists
 * the room's saved layouts.
 */
export function RoomDetails({
  room,
  catalogItems,
  category,
  layouts,
}: {
  room: Room
  catalogItems: CatalogItem[]
  category: ItemCategory | undefined
  layouts: readonly LayoutWithItems[]
}) {
  const summary = `${room.widthCm} × ${room.lengthCm} cm · ${formatArea(room)}`
  const label = formatRoomLocation(room)
  const location = resolveRoomLocation(room)
  const { itemsFor, removeItem } = useDraftLayouts()
  const placedItems = itemsFor(room.id)

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

      {/* Editor: placed items | plan | catalog. On small screens the plan comes first. */}
      <div className="grid gap-6 lg:h-[30rem] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_16rem] xl:h-[34rem] xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <section
          aria-labelledby="placed-items-heading"
          className="order-3 grid gap-3 rounded-lg border border-border bg-background p-4 lg:order-none lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="placed-items-heading" className="text-sm font-semibold text-foreground">
              Placed items
            </h2>
            <span className="text-xs text-muted-foreground">
              {placedItems.length === 1 ? '1 item' : `${placedItems.length} items`}
            </span>
          </div>
          <div className="lg:min-h-0 lg:overflow-y-auto">
            <PlacedItemsList
              items={placedItems}
              onRemove={(id) => removeItem(room.id, id)}
            />
          </div>
        </section>

        <section
          aria-labelledby="room-plan-heading"
          className="order-1 grid gap-2 lg:order-none lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="room-plan-heading" className="text-sm font-semibold text-foreground">
              2D plan
            </h2>
            <p className="text-xs text-muted-foreground">
              Drag to pan · Scroll to zoom
            </p>
          </div>
          <RoomPlan room={room} />
        </section>

        <RoomCatalog
          className="order-2 lg:order-none"
          room={room}
          items={catalogItems}
          category={category}
        />
      </div>

      {/* Layouts: the current plan can be saved, and its saved versions live here. */}
      <div className="mt-6">
        <SavedLayouts room={room} roomId={room.id} layouts={layouts}>
          <SaveLayoutForm roomId={room.id} items={placedItems} savedLayouts={layouts} />
        </SavedLayouts>
      </div>
    </div>
  )
}
