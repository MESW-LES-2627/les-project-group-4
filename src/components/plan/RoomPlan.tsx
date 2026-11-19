'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

import type { CatalogItem, Room } from '@/api/types'
import { useDraftLayouts } from '@/hooks/useDraftLayouts'

const Plan2D = dynamic(
  () => import('./Plan2D').then((module) => module.Plan2D),
  {
    ssr: false,
    loading: () => <PlanLoading />,
  },
)

function PlanLoading() {
  return (
    <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary sm:h-105">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
      <p role="status" className="relative text-sm text-muted-foreground">
        Loading plan…
      </p>
    </div>
  )
}

/**
 * US-06a: the room's working layout. US-09: the items come from the session
 * draft provider, so the catalog can add to this room and they survive
 * navigation.
 */
export function RoomPlan({ room }: { room: Room }) {
  const { itemsFor, addItemAt } = useDraftLayouts()
  const items = itemsFor(room.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) ?? null

  function handleDropItem(item: CatalogItem, xCm: number, yCm: number) {
    addItemAt(room.id, room, item, { xCm, yCm, rotationDeg: 0 })
  }

  const caption = selected
    ? `Selected: ${selected.name} · ${selected.widthCm} × ${selected.depthCm} cm`
    : items.length === 0
      ? null
      : 'Click an item to select it.'

  return (
    <figure
      className={
        caption === null
          ? 'grid lg:h-full'
          : 'grid gap-3 lg:h-full lg:grid-rows-[minmax(0,1fr)_auto]'
      }
    >
      <div className="relative h-80 min-h-0 w-full overflow-hidden rounded-lg border border-border bg-secondary sm:h-105 lg:h-full">
        <div className="relative h-full w-full">
          <Plan2D
            room={room}
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDropItem={handleDropItem}
          />
        </div>
      </div>

      {caption !== null ? (
        <figcaption aria-live="polite" className="text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
