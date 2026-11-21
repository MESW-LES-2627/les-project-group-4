import type { RoomSize } from '@/features/plan/model/geometry'

/** Camera-space bounds for the top-down orthographic camera. */
export interface OrthoFrustum {
  left: number
  right: number
  top: number
  bottom: number
}

const DEFAULT_PADDING_M = 0.4

/** Height of the top-down plan camera above the floor, in metres. */
export const CAMERA_HEIGHT_M = 10

/** Zoom limits shared by the scroll wheel and the zoom buttons. */
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 8

const ZOOM_STEP = 1.25

export type ZoomDirection = 'in' | 'out'

/** One click of the zoom buttons, clamped to the controls' zoom limits. */
export function stepZoom(zoom: number, direction: ZoomDirection): number {
  const scale = direction === 'in' ? ZOOM_STEP : 1 / ZOOM_STEP
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * scale))
}

/**
 * The largest "nice" length (1, 2 or 5 times a power of ten) that fits in
 * `maxMetres`. Keeps the scale bar between roughly 40% and 100% of its target
 * width no matter the zoom level.
 */
export function niceScaleMetres(maxMetres: number): number {
  if (!Number.isFinite(maxMetres) || maxMetres <= 0) return 0.1

  const exponent = Math.floor(Math.log10(maxMetres))
  const base = 10 ** exponent
  const fraction = maxMetres / base

  if (fraction >= 5) return 5 * base
  if (fraction >= 2) return 2 * base
  return base
}

/** Target length of the scale bar and a major grid square, in pixels. */
const SCALE_TARGET_PX = 110

/** Minor grid cells inside one major square. */
export const MINOR_PER_MAJOR = 5

export interface PlanScale {
  /** Length of the scale bar and of one major grid square, in metres. */
  metres: number
  /** The same length in pixels. */
  px: number
}

/**
 * The labelled scale bar length at a given plan scale. The grid uses the same
 * value for its major squares, so the ruler and the grid always agree.
 */
export function planScale(pxPerMetre: number): PlanScale {
  if (!Number.isFinite(pxPerMetre) || pxPerMetre <= 0) {
    return { metres: 1, px: 0 }
  }

  const metres = niceScaleMetres(SCALE_TARGET_PX / pxPerMetre)
  return { metres, px: metres * pxPerMetre }
}

/** Camera position and controls target that frame the room from above. */
export interface PlanViewPose {
  position: [number, number, number]
  target: [number, number, number]
}

/**
 * The default plan view: the room centre in the middle of the screen and the
 * camera straight above it. Shared by the initial camera setup and "reset
 * view", so the two can never drift apart.
 */
export function planViewPose(room: RoomSize): PlanViewPose {
  const x = room.widthCm / 200
  const z = room.lengthCm / 200

  return {
    position: [x, CAMERA_HEIGHT_M, z],
    target: [x, 0, z],
  }
}

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
