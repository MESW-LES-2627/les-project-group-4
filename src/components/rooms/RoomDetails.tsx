'use client'

import type { CatalogItem, Room } from '@/api/types'
import { RoomCatalog } from '@/components/catalog/RoomCatalog'
import { RegisterCurrentRoom } from '@/components/layout/RegisterCurrentRoom'
import { PlacedItemsList } from '@/components/plan/PlacedItemsList'
import { RoomPlan } from '@/components/plan/RoomPlan'
import { useDraftLayouts } from '@/hooks/useDraftLayouts'
import type { ItemCategory } from '@/lib/catalog'
import { formatRoomLocation, resolveRoomLocation } from '@/lib/location'
import { formatArea } from '@/lib/roomFormat'
import { COORDINATE_DECIMALS } from '@/lib/schemas/room'

/**
 * US-03: one room's details, including the 2D plan. US-15: with its saved location.
 * US-09: the catalog panel and placed-items list sit on either side of the plan
 * in a three-panel "design tool" layout.
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
  const { itemsFor, removeItem } = useDraftLayouts()
  const placedItems = itemsFor(room.id)

  return (
    <div className="grid gap-6">
      <RegisterCurrentRoom room={room} />
      <div className="mx-auto w-full max-w-4xl">
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
      </div>

      <div className="grid gap-x-6 gap-y-3 lg:grid-cols-[minmax(12rem,1fr)_minmax(24rem,56rem)_minmax(18rem,1fr)] items-start">
        {/* Desktop title row */}
        <div className="hidden lg:flex lg:max-w-[22rem] lg:justify-self-end items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Placed items</h2>
          <span className="text-xs text-muted-foreground">
            {placedItems.length === 1 ? '1 item' : `${placedItems.length} items`}
          </span>
        </div>

        <div className="order-1 lg:order-none lg:mx-auto lg:w-full lg:max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">2D plan</h2>
            <p className="text-xs text-muted-foreground">
              Drag to pan · Scroll to zoom
            </p>
          </div>
        </div>

        <div className="hidden lg:block lg:max-w-[22rem] lg:justify-self-start">
          <h2 className="text-sm font-semibold text-foreground">Add items</h2>
        </div>

        {/* Content row */}
        <section
          aria-labelledby="placed-items-heading"
          className="order-3 grid gap-2 rounded-lg border border-border bg-background p-4 lg:order-4 lg:max-w-[22rem] lg:justify-self-end lg:sticky lg:top-6 lg:max-h-[640px] lg:overflow-y-auto"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 lg:hidden">
            <h2 id="placed-items-heading" className="text-sm font-semibold text-foreground">
              Placed items
            </h2>
            <span className="text-xs text-muted-foreground">
              {placedItems.length === 1 ? '1 item' : `${placedItems.length} items`}
            </span>
          </div>
          <PlacedItemsList
            items={placedItems}
            onRemove={(id) => removeItem(room.id, id)}
          />
        </section>

        <section aria-label="2D plan" className="order-2 lg:order-5">
          <RoomPlan room={room} />
        </section>

        <div className="order-4 lg:order-6 lg:max-w-[22rem] lg:justify-self-start lg:sticky lg:top-6 lg:max-h-[640px] lg:overflow-y-auto">
          <RoomCatalog
            room={room}
            items={catalogItems}
            category={category}
            headerClassName="lg:hidden"
          />
        </div>
      </div>
    </div>
  )
}
