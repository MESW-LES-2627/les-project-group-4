'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ScanLine } from 'lucide-react'

import type { CatalogItem, LayoutSummary, Room } from '@/api/types'
import { SaveLayoutForm } from '@/components/layouts/SaveLayoutForm'
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
 * navigation. US-13b: they can be saved as a named layout.
 */
export function RoomPlan({
  room,
  layouts,
}: {
  room: Room
  layouts: readonly LayoutSummary[]
}) {
  const { itemsFor, addItemAt } = useDraftLayouts()
  const items = itemsFor(room.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) ?? null

  function handleDropItem(item: CatalogItem, xCm: number, yCm: number) {
    addItemAt(room.id, room, item, { xCm, yCm, rotationDeg: 0 })
  }

  return (
    <div className="grid gap-3">
      <figure className="grid gap-3">
        <div className="relative h-80 w-full overflow-hidden rounded-lg border border-border bg-secondary sm:h-105">
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

        <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span aria-live="polite">
            {selected
              ? `Selected: ${selected.name} · ${selected.widthCm} × ${selected.depthCm} cm`
              : items.length === 0
                ? null
                : 'Click an item to select it.'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <ScanLine className="size-3.5" aria-hidden="true" />
            Drawn to scale
          </span>
        </figcaption>

        {/* US-13b: saves the items above. */}
        <SaveLayoutForm roomId={room.id} items={items} savedLayouts={layouts} />
      </figure>

    </div>
  )
}
