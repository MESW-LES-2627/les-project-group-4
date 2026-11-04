import { sizeToScene, toScene } from '@/lib/geometry/plan'
import type { PlacedItem as PlacedItemData } from '@/lib/layout/layout'

export const ITEM_COLOR = '#cbd5e1'
export const ITEM_HEIGHT_M = 0.02

export interface PlacedItemProps {
  item: PlacedItemData
  height?: number // box height in metres (2D plan uses a thin footprint)
}

/**
 * One placed item as a true-to-scale box on the floor.
 */
export function PlacedItem({ item, height = ITEM_HEIGHT_M }: PlacedItemProps) {
  const { x, z, rotationY } = toScene(item)
  const { width, depth } = sizeToScene(item)

  return (
    <group
      name={`placed-item-${item.id}`}
      position={[x, 0, z]}
      rotation={[0, rotationY, 0]}
    >
      <mesh
        name={`placed-item-mesh-${item.id}`}
        position={[0, height / 2, 0]}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial color={ITEM_COLOR} />
      </mesh>
    </group>
  )
}
