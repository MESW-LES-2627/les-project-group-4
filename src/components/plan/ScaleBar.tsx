import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrthographicCamera } from 'three'

import { dimensionLabelText } from './label'
import { niceScaleMetres } from './ortho'

/** Aim for a bar about this wide, then snap the length to a round number. */
const TARGET_BAR_PX = 110

interface ScaleBarProps {
  lineRef: RefObject<HTMLDivElement | null>
  textRef: RefObject<HTMLSpanElement | null>
}

/** A small ruler in the corner of the plan. */
export function ScaleBar({ lineRef, textRef }: ScaleBarProps) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-col items-center gap-1 rounded border border-border bg-background/85 px-1.5 py-1 shadow-sm">
      <div
        ref={lineRef}
        className="h-1.5 border-x border-b border-muted-foreground/70"
        style={{ width: 0 }}
      />
      <span
        ref={textRef}
        className="text-[10px] font-medium text-muted-foreground"
      />
    </div>
  )
}

/** Keeps the scale bar in sync with the camera's zoom, every frame. */
export function ScaleBarProjector({ lineRef, textRef }: ScaleBarProps) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useFrame(() => {
    const ortho = camera as OrthographicCamera
    if (!ortho.isOrthographicCamera) return

    const visibleHeightM = (ortho.top - ortho.bottom) / ortho.zoom
    if (!Number.isFinite(visibleHeightM) || visibleHeightM <= 0) return

    const pxPerMetre = size.height / visibleHeightM
    const metres = niceScaleMetres(TARGET_BAR_PX / pxPerMetre)

    if (lineRef.current) {
      lineRef.current.style.width = `${metres * pxPerMetre}px`
    }
    if (textRef.current) {
      textRef.current.textContent = dimensionLabelText(metres * 100)
    }
  })

  return null
}
