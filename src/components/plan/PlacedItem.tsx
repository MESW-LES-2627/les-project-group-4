import type { ThreeEvent } from '@react-three/fiber'

import { sizeToScene, toScene } from '@/lib/geometry/plan'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

export const ITEM_COLOR = '#cbd5e1'
export const SELECTED_ITEM_COLOR = '#2563eb'
export const ITEM_HEIGHT_M = 0.02

const CLICK_TOLERANCE_PX = 4

export interface PlacedItemProps {
  item: PlacedItemData
  height?: number // box height in metres (2D plan uses a thin footprint)
  selected?: boolean
  onSelect?: (id: string) => void
}

/**
 * One placed item as a true-to-scale box on the floor.
 */
export function PlacedItem({
  item,
  height = ITEM_HEIGHT_M,
  selected = false,
  onSelect,
}: PlacedItemProps) {
  const { x, z, rotationY } = toScene(item)
  const { width, depth } = sizeToScene(item)

  function handleClick(event: ThreeEvent<MouseEvent>) {
    // a pan that starts on an item must not select it
    event.stopPropagation()
    if (event.delta > CLICK_TOLERANCE_PX) return
    onSelect?.(item.id)
  }

  return (
    <group
      name={`placed-item-${item.id}`}
      position={[x, 0, z]}
      rotation={[0, rotationY, 0]}
    >
      <mesh
        name={`placed-item-mesh-${item.id}`}
        position={[0, height / 2, 0]}
        onClick={onSelect ? handleClick : undefined}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={selected ? SELECTED_ITEM_COLOR : ITEM_COLOR} />
      </mesh>
    </group>
  )
}
