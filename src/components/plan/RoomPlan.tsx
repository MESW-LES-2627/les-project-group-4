'use client'

import { useReducer, useState } from 'react'
import dynamic from 'next/dynamic'
import { ScanLine } from 'lucide-react'

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
    <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary sm:h-105">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:16px_16px]" />
      <p role="status" className="relative text-sm text-muted-foreground">
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">2D plan</h2>
        <p className="text-xs text-muted-foreground">Drag to pan · Scroll to zoom</p>
      </div>

      <div className="relative h-80 w-full overflow-hidden rounded-lg border border-border bg-secondary sm:h-105">
        <div className="absolute inset-0 opacity-70 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[16px_16px]" />
        <div className="relative h-full w-full">
          <Plan2D
            room={room}
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span aria-live="polite">
          {selected
            ? `Selected: ${selected.name} · ${selected.widthCm} × ${selected.depthCm} cm`
            : items.length === 0
              ? 'No items placed in this room yet.'
              : 'Click an item to select it.'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs">
          <ScanLine className="size-3.5" aria-hidden="true" />
          Drawn to scale
        </span>
      </figcaption>
    </figure>
  )
}
