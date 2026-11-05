import { useMemo, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Camera } from 'three'
import { Vector3 } from 'three'

import type { RoomSize } from '@/lib/geometry/plan'

import { dimensionLabelText } from './label'

/** Gap between the room edge and its dimension label, in metres. */
const OFFSET_M = 0.2

const LABEL_CLASS =
  'whitespace-nowrap rounded border border-border bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm'

type LabelRef = RefObject<HTMLDivElement | null>

interface DimensionLabelsProps {
  room: RoomSize
  widthRef: LabelRef
  depthRef: LabelRef
}

/**
 * The room's width along the top edge and its length down the left edge.
 *
 * These are plain DOM, projected by <DimensionProjector> inside the canvas.
 * drei's Html creates a React root per label, and with more than one instance
 * only the last one renders its children.
 */
export function DimensionLabels({ room, widthRef, depthRef }: DimensionLabelsProps) {
  return (
    <>
      <div
        ref={widthRef}
        className="pointer-events-none absolute top-0 left-0 z-[5]"
        style={{ visibility: 'hidden' }}
      >
        <span className={LABEL_CLASS}>{dimensionLabelText(room.widthCm)}</span>
      </div>

      <div
        ref={depthRef}
        className="pointer-events-none absolute top-0 left-0 z-[5]"
        style={{ visibility: 'hidden' }}
      >
        <span className={`${LABEL_CLASS} inline-block -rotate-90`}>
          {dimensionLabelText(room.lengthCm)}
        </span>
      </div>
    </>
  )
}

/** Projects the room's edge midpoints to screen space every frame. */
export function DimensionProjector({ room, widthRef, depthRef }: DimensionLabelsProps) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const widthM = room.widthCm / 100
  const depthM = room.lengthCm / 100

  const points = useMemo(
    () => ({
      width: new Vector3(widthM / 2, 0, -OFFSET_M),
      depth: new Vector3(-OFFSET_M, 0, depthM / 2),
    }),
    [widthM, depthM],
  )

  useFrame(() => {
    place(widthRef.current, points.width, camera, size)
    place(depthRef.current, points.depth, camera, size)
  })

  return null
}

const projected = new Vector3()

function place(
  el: HTMLDivElement | null,
  point: Vector3,
  camera: Camera,
  size: { width: number; height: number },
) {
  if (!el) return

  projected.copy(point).project(camera)

  const x = (projected.x * 0.5 + 0.5) * size.width
  const y = (-projected.y * 0.5 + 0.5) * size.height

  el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
  el.style.visibility = 'visible'
}
