import type { ReactNode } from 'react'

import type { RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'

import { PlacedItem } from './PlacedItem'
import type { ItemPointerHandler } from './PlacedItem'
import { RoomFloor } from './RoomFloor'

export interface RoomSceneProps {
  room: RoomSize
  items?: PlacedItemData[]
  itemHeight?: number // Item box height in metres (defaults to the thin 2D footprint)
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** US-10: forwarded to every item so the plan can drag it. */
  onItemPointerDown?: ItemPointerHandler
  onItemPointerMove?: ItemPointerHandler
  onItemPointerUp?: ItemPointerHandler
  onItemPointerCancel?: ItemPointerHandler
  /** Label slot, so the shared scene does not import DOM-only components. */
  renderLabel?: (item: PlacedItemData, selected: boolean) => ReactNode
}

/**
 * The camera-agnostic room scene.
 *
 * `Plan2D` adds an orthographic camera and controls; a future 3D view can use
 * the same scene graph and item components with a perspective camera.
 * Coordinates come from src/lib/geometry/plan.ts: cm -> metres, plan y ->
 * scene z, Y-up.
 */
export function RoomScene({
  room,
  items = [],
  itemHeight,
  selectedId = null,
  onSelect,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  onItemPointerCancel,
  renderLabel,
}: RoomSceneProps) {
  return (
    <group name="room-scene">
      <RoomFloor room={room} onClick={onSelect ? () => onSelect(null) : undefined} />

      <group name="room-items">
        {items.map((item) => (
          <PlacedItem
            key={item.id}
            item={item}
            height={itemHeight}
            selected={item.id === selectedId}
            onSelect={onSelect}
            onPointerDown={onItemPointerDown}
            onPointerMove={onItemPointerMove}
            onPointerUp={onItemPointerUp}
            onPointerCancel={onItemPointerCancel}
            label={renderLabel?.(item, selectedId === item.id)}
          />
        ))}
      </group>
    </group>
  )
}
