import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrthographicCamera } from 'three'

import { MINOR_PER_MAJOR, planScale } from '@/features/plan/model/ortho'

const MINOR_COLOR = 'color-mix(in oklch, var(--border), transparent 35%)'
const MAJOR_COLOR = 'var(--border)'

const GRID_IMAGE = [
  `linear-gradient(to right, ${MAJOR_COLOR} 1px, transparent 1px)`,
  `linear-gradient(to bottom, ${MAJOR_COLOR} 1px, transparent 1px)`,
  `linear-gradient(to right, ${MINOR_COLOR} 1px, transparent 1px)`,
  `linear-gradient(to bottom, ${MINOR_COLOR} 1px, transparent 1px)`,
].join(', ')

/** The plan's metre grid. <PlanGridProjector> anchors it to world space. */
export function PlanGrid({ gridRef }: { gridRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={gridRef}
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{ backgroundImage: GRID_IMAGE }}
    />
  )
}

/**
 * Keeps the CSS grid in sync with the plan: one tile per grid step, offset so
 * the lines stay on whole metres while the user pans and zooms.
 */
export function PlanGridProjector({ gridRef }: { gridRef: RefObject<HTMLDivElement | null> }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useFrame(() => {
    const el = gridRef.current
    const ortho = camera as OrthographicCamera
    if (!el || !ortho.isOrthographicCamera) return

    const visibleHeightM = (ortho.top - ortho.bottom) / ortho.zoom
    if (!Number.isFinite(visibleHeightM) || visibleHeightM <= 0) return

    const pxPerMetre = size.height / visibleHeightM
    // A major square is exactly the length the scale bar labels.
    const majorPx = planScale(pxPerMetre).px
    const stepPx = majorPx / MINOR_PER_MAJOR

    // The camera looks straight down, so its x/z is the screen centre.
    const originX = Math.round(size.width / 2 - ortho.position.x * pxPerMetre)
    const originY = Math.round(size.height / 2 - ortho.position.z * pxPerMetre)
    const position = `${originX}px ${originY}px`

    el.style.backgroundSize = `${majorPx}px ${majorPx}px, ${majorPx}px ${majorPx}px, ${stepPx}px ${stepPx}px, ${stepPx}px ${stepPx}px`
    el.style.backgroundPosition = `${position}, ${position}, ${position}, ${position}`
  })

  return null
}
