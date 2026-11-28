/**
 * US-10 — placement manipulation helpers.
 *
 * Positions stay in room centimetres and use the geometry contract in
 * geometry.ts: (xCm, yCm) is the footprint centre and rotationDeg turns
 * clockwise. Dragging and rotating both end in clampPlacementToRoom, and the
 * draft reducer refuses a placement that still does not fit, so an item can
 * never be committed outside the room (AT-4).
 */

import {
  EPSILON_CM,
  boundingBox,
  normalizeRotation,
  type Placement,
  type Point,
  type RoomSize,
  type Size,
} from '@/features/plan/model/geometry'

/** Dragging snaps the footprint centre to whole centimetres. */
export const DRAG_SNAP_CM = 1

/** One rotate action turns the footprint a quarter turn clockwise. */
export const ROTATION_STEP_DEG = 90

/** Keeps near-integer results integral when a rotated box adds float noise. */
function clean(value: number): number {
  const rounded = Math.round(value)
  return Math.abs(value - rounded) <= EPSILON_CM ? rounded : value
}

/**
 * Clamps the centre of one axis so the footprint stays between the walls.
 * `halfExtentCm` is half the footprint's rotated bounding box on that axis.
 * An item larger than the room is centred instead of producing an inverted range.
 */
function clampAxis(
  centreCm: number,
  halfExtentCm: number,
  roomExtentCm: number,
  snapCm: number,
): number {
  if (2 * halfExtentCm > roomExtentCm + EPSILON_CM) {
    return roomExtentCm / 2
  }

  // min/max because an exact fit can produce 50.00000000000001 and 49.99…
  const min = Math.min(halfExtentCm, roomExtentCm - halfExtentCm)
  const max = Math.max(halfExtentCm, roomExtentCm - halfExtentCm)

  const factor = snapCm > 0 ? snapCm : 1
  const snapped = snapCm > 0
    ? Math.round(centreCm / factor) * factor
    : centreCm
  return clean(Math.min(max, Math.max(min, snapped)))
}

/**
 * The placement with its centre clamped inside the room (AT-4). By default it
 * snaps to DRAG_SNAP_CM; pass 0 for a smooth drag preview that still respects
 * the walls. Rotation is preserved.
 */
export function clampPlacementToRoom(
  size: Size,
  placement: Placement,
  room: RoomSize,
  snapCm = DRAG_SNAP_CM,
): Placement {
  const box = boundingBox(size, placement)
  return {
    ...placement,
    xCm: clampAxis(placement.xCm, (box.maxX - box.minX) / 2, room.widthCm, snapCm),
    yCm: clampAxis(placement.yCm, (box.maxY - box.minY) / 2, room.lengthCm, snapCm),
  }
}

/**
 * The placement produced by dragging the footprint when the pointer is at
 * `pointer`. `grabOffsetCm` is where the pointer grabbed the item relative to
 * its centre (centre − pointer at pointerdown), so the same point of the item
 * stays under the cursor. Rotation is unchanged; the result is clamped by
 * default and snapped to DRAG_SNAP_CM. Pass snapCm = 0 for a smooth preview.
 */
export function dragPlacement(
  size: Size,
  placement: Placement,
  pointer: Point,
  grabOffsetCm: Point,
  room: RoomSize,
  snapCm = DRAG_SNAP_CM,
): Placement {
  return clampPlacementToRoom(
    size,
    {
      ...placement,
      xCm: pointer.x + grabOffsetCm.x,
      yCm: pointer.y + grabOffsetCm.y,
    },
    room,
    snapCm,
  )
}

/**
 * The placement after turning the footprint clockwise by `stepDeg`, around its
 * own centre. The centre only moves when the rotated footprint would leave the
 * room, where clampPlacementToRoom nudges it the minimum amount needed.
 */
export function rotatePlacement(
  size: Size,
  placement: Placement,
  room: RoomSize,
  stepDeg = ROTATION_STEP_DEG,
): Placement {
  return clampPlacementToRoom(
    size,
    {
      ...placement,
      rotationDeg: normalizeRotation(placement.rotationDeg + stepDeg),
    },
    room,
  )
}
