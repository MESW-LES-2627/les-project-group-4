import type { RoomSize } from '@/lib/geometry/plan'

/** Camera-space bounds for the top-down orthographic camera. */
export interface OrthoFrustum {
  left: number
  right: number
  top: number
  bottom: number
}

const DEFAULT_PADDING_M = 0.4

/**
 * Fit the room into an orthographic camera that looks straight down at the
 * room's centre. Both axes use the same metres-per-pixel scale, so the plan
 * keeps the room's proportions (AT-1).
 */
export function fitOrthoFrustum(
  room: RoomSize,
  aspect: number,
  paddingM = DEFAULT_PADDING_M,
): OrthoFrustum {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  const padding = Number.isFinite(paddingM) ? Math.max(0, paddingM) : DEFAULT_PADDING_M

  const widthM = room.widthCm / 100 + 2 * padding
  const depthM = room.lengthCm / 100 + 2 * padding

  // fit the tighter axis (the other axis gets extra space, not extra scale)
  const halfHeight = Math.max(depthM / 2, widthM / (2 * safeAspect))
  const halfWidth = halfHeight * safeAspect

  return {
    left: -halfWidth,
    right: halfWidth,
    top: halfHeight,
    bottom: -halfHeight,
  }
}
