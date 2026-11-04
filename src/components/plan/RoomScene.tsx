import type { RoomSize } from '@/lib/geometry/plan'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

import { PlacedItem } from './PlacedItem'
import { RoomFloor } from './RoomFloor'

export interface RoomSceneProps {
  room: RoomSize
  items?: PlacedItemData[]
  itemHeight?: number // Item box height in metres (defaults to the thin 2D footprint)
  selectedId?: string | null
  onSelect?: (id: string | null) => void
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
          />
        ))}
      </group>
    </group>
  )
}
