'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'

import type { PlacedItem } from '@/lib/layout/layout'

import { ItemLabel } from './ItemLabel'

/**
 * US-06a AT-4: item labels as plain DOM, projected by ItemLabelProjector.
 *
 * drei's Html creates a React root per label, and with more than one instance
 * only the last one renders its children (see DimensionLabels). This overlay
 * keeps every item's label visible.
 */
export function ItemLabels({
  items,
  selectedId,
  labelRefs,
}: {
  items: PlacedItem[]
  selectedId: string | null
  labelRefs: Map<string, HTMLDivElement | null>
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[6]">
      {items.map((item) => (
        <div
          key={item.id}
          ref={(element) => {
            if (element === null) {
              labelRefs.delete(item.id)
            } else {
              labelRefs.set(item.id, element)
            }
          }}
          className="absolute top-0 left-0 will-change-transform"
          style={{ visibility: 'hidden' }}
        >
          <ItemLabel item={item} selected={item.id === selectedId} />
        </div>
      ))}
    </div>
  )
}

const projected = new Vector3()

/** Projects each item's centre to screen space every frame. */
export function ItemLabelProjector({
  items,
  labelRefs,
}: {
  items: PlacedItem[]
  labelRefs: Map<string, HTMLDivElement | null>
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useFrame(() => {
    for (const item of items) {
      const element = labelRefs.get(item.id)
      if (!element) continue

      projected.set(item.xCm / 100, 0, item.yCm / 100).project(camera)

      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      element.style.visibility = 'visible'
    }
  })

  return null
}
