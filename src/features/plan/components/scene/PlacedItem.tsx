import { useMemo, type ReactNode } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

import { sizeToScene, toScene } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'

/**
 * Shared with the saved-layout miniatures (LayoutThumbnail), so the plan and
 * the previews draw items with the same fill, border and opacity.
 */
export const ITEM_COLOR = '#2a2622'
export const SELECTED_ITEM_COLOR = '#b4552d'
export const SELECTED_ITEM_BORDER_COLOR = '#9e4823'
export const ITEM_FILL_OPACITY = 0.16
export const ITEM_BORDER_OPACITY = 0.35
export const ITEM_HEIGHT_M = 0.02

const CLICK_TOLERANCE_PX = 4

/** US-10: a pointer event on one placed item, with the item it belongs to. */
export type ItemPointerHandler = (
  item: PlacedItemData,
  event: ThreeEvent<PointerEvent>,
) => void

export interface PlacedItemProps {
  item: PlacedItemData
  height?: number // box height in metres (2D plan uses a thin footprint)
  selected?: boolean
  onSelect?: (id: string) => void
  /** US-10: pointer handlers used by the plan to drag the item. */
  onPointerDown?: ItemPointerHandler
  onPointerMove?: ItemPointerHandler
  onPointerUp?: ItemPointerHandler
  onPointerCancel?: ItemPointerHandler
  /** Optional label rendered above the footprint (2D uses an HTML label). */
  label?: ReactNode
}

/**
 * One placed item as a true-to-scale box on the floor.
 */
export function PlacedItem({
  item,
  height = ITEM_HEIGHT_M,
  selected = false,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  label,
}: PlacedItemProps) {
  const { x, z, rotationY } = toScene(item)
  const { width, depth } = sizeToScene(item)

  // The footprint outline, in the item's local space. The line loop closes it.
  const outline = useMemo(
    () =>
      new Float32Array([
        -width / 2,
        0,
        -depth / 2,
        width / 2,
        0,
        -depth / 2,
        width / 2,
        0,
        depth / 2,
        -width / 2,
        0,
        depth / 2,
      ]),
    [width, depth],
  )

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
        onPointerDown={
          onPointerDown ? (event) => onPointerDown(item, event) : undefined
        }
        onPointerMove={
          onPointerMove ? (event) => onPointerMove(item, event) : undefined
        }
        onPointerUp={onPointerUp ? (event) => onPointerUp(item, event) : undefined}
        onPointerCancel={
          onPointerCancel ? (event) => onPointerCancel(item, event) : undefined
        }
      >
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial
          color={selected ? SELECTED_ITEM_COLOR : ITEM_COLOR}
          transparent={!selected}
          opacity={selected ? 1 : ITEM_FILL_OPACITY}
        />
      </mesh>

      {/* Same border as the saved-layout miniatures, on the top face. */}
      <lineLoop
        name={`placed-item-outline-${item.id}`}
        position={[0, height + 0.001, 0]}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outline, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={selected ? SELECTED_ITEM_BORDER_COLOR : ITEM_COLOR}
          transparent
          opacity={selected ? 1 : ITEM_BORDER_OPACITY}
        />
      </lineLoop>

      {label ? (
        <group position={[0, height + 0.05, 0]}>{label}</group>
      ) : null}
    </group>
  )
}
