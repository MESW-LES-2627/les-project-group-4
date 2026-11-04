'use client'

import { useReducer, useState } from 'react'
import dynamic from 'next/dynamic'

import type { Room } from '@/api/types'
import { layoutReducer } from '@/lib/layout/layout'

const Plan2D = dynamic(
  () => import('./Plan2D').then((module) => module.Plan2D),
  {
    ssr: false,
    loading: () => <PlanLoading />,
  },
)

function PlanLoading() {
  return (
    <div className="flex h-80 w-full items-center justify-center rounded-lg border bg-slate-50 sm:h-105">
      <p role="status" className="text-sm text-muted-foreground">
        Loading plan…
      </p>
    </div>
  )
}

/**
 * US-06a: the room's working layout, kept client-side until save (#31/#35).
 * The reducer is the shared contract; #31 lifts it into a provider so the
 * catalog can add and remove items.
 */
export function RoomPlan({ room }: { room: Room }) {
  const [items] = useReducer(layoutReducer, [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = items.find((item) => item.id === selectedId) ?? null

  return (
    <figure className="grid gap-3">
      <div className="h-80 w-full overflow-hidden rounded-lg border border-slate-200 sm:h-105">
        <Plan2D
          room={room}
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <figcaption className="grid gap-1 text-sm text-muted-foreground">
        <span>Drag to pan and scroll to zoom.</span>
        <span aria-live="polite">
          {selected
            ? `Selected: ${selected.name} · ${selected.widthCm} × ${selected.depthCm} cm`
            : items.length === 0
              ? 'No items placed in this room yet.'
              : 'Click an item to select it.'}
        </span>
      </figcaption>
    </figure>
  )
}
