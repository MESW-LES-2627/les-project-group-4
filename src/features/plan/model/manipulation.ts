/**
 * US-10 — placement manipulation helpers.
 *
 * Positions stay in room centimetres and use the geometry contract in
 * geometry.ts: (xCm, yCm) is the footprint centre and rotationDeg turns
 * clockwise. Dragging and rotating both end in clampPlacementToRoom, so an
 * item can never be committed outside the room (AT-4).
 */

import {
  EPSILON_CM,
  boundingBox,
  type Placement,
  type RoomSize,
  type Size,
} from "@/features/plan/model/geometry";

/** Dragging snaps the footprint centre to whole centimetres. */
export const DRAG_SNAP_CM = 1;

/** Keeps near-integer results integral when a rotated box adds float noise. */
function clean(value: number): number {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) <= EPSILON_CM ? rounded : value;
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
): number {
  if (2 * halfExtentCm > roomExtentCm + EPSILON_CM) {
    return roomExtentCm / 2;
  }

  // min/max because an exact fit can produce 50.00000000000001 and 49.99…
  const min = Math.min(halfExtentCm, roomExtentCm - halfExtentCm);
  const max = Math.max(halfExtentCm, roomExtentCm - halfExtentCm);

  const snapped = Math.round(centreCm / DRAG_SNAP_CM) * DRAG_SNAP_CM;
  return clean(Math.min(max, Math.max(min, snapped)));
}

/**
 * The placement with its centre clamped inside the room (AT-4) and snapped to
 * DRAG_SNAP_CM. Rotation is preserved. The rotated bounding box is exact for
 * the axis-aligned room (see boundingBox in geometry.ts).
 */
export function clampPlacementToRoom(
  size: Size,
  placement: Placement,
  room: RoomSize,
): Placement {
  const box = boundingBox(size, placement);
  return {
    ...placement,
    xCm: clampAxis(placement.xCm, (box.maxX - box.minX) / 2, room.widthCm),
    yCm: clampAxis(placement.yCm, (box.maxY - box.minY) / 2, room.lengthCm),
  };
}
