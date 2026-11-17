/**
 * US-09 — default placement: shelf-pack new items against the top wall, left to
 * right, wrapping to the next row. Coordinates and the centre-based contract
 * are in src/lib/geometry/plan.ts.
 *
 * Candidates are the walls plus the bottom/right edges of existing items; the
 * first free spot wins (margin 0, touching allowed). Existing items are never
 * moved. Overlap uses AABBs, exact at 0°/90°; SAT is US-11.
 */

import { EPSILON_CM, boundingBox, isInsideRoom } from '@/lib/geometry/plan'
import type { Box, Placement, RoomSize, Size } from '@/lib/geometry/plan'

/** A footprint already in the room: its size and where it sits. */
export type PlacedFootprint = Size & Placement

/** How far from each wall new items are placed. Flush for now (AT-2). */
export const PLACEMENT_MARGIN_CM = 0

/**
 * The placement that puts the footprint's bounding box exactly at
 * (leftCm, topCm) with this rotation. The bounding box is centred on the
 * placement point, so for 90° the width and depth swap.
 */
function placementAt(
  size: Size,
  leftCm: number,
  topCm: number,
  rotationDeg: number,
): Placement {
  const box = boundingBox(size, { xCm: 0, yCm: 0, rotationDeg })
  return {
    xCm: leftCm + (box.maxX - box.minX) / 2,
    yCm: topCm + (box.maxY - box.minY) / 2,
    rotationDeg,
  }
}

/** True when two boxes share area. Touching edges do not count as a conflict. */
function overlaps(a: Box, b: Box): boolean {
  return (
    a.minX < b.maxX - EPSILON_CM &&
    a.maxX > b.minX + EPSILON_CM &&
    a.minY < b.maxY - EPSILON_CM &&
    a.maxY > b.minY + EPSILON_CM
  )
}

/** Ascending, deduplicated candidate coordinates. */
function candidates(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b)
}

/**
 * The default placement for an item, or null when it fits nowhere.
 *
 * The result is always at rotation 0 (90° fallback is the next US-09 step).
 * The scan is deterministic: top-most row first, left-most free spot first.
 */
export function placeInRoom(
  size: Size,
  room: RoomSize,
  existing: ReadonlyArray<PlacedFootprint> = [],
): Placement | null {
  const boxes = existing.map((item) => boundingBox(item, item))

  // Row tops and column starts are the walls plus the edges already in use, so
  // the first candidate is always the top-left corner of the room.
  const rowTops = candidates([0, ...boxes.map((box) => box.maxY)])
  const leftEdges = candidates([0, ...boxes.map((box) => box.maxX)])

  for (const topCm of rowTops) {
    for (const leftCm of leftEdges) {
      const placement = placementAt(size, leftCm, topCm, 0)
      if (!isInsideRoom(size, placement, room, PLACEMENT_MARGIN_CM)) continue

      const box = boundingBox(size, placement)
      if (boxes.some((other) => overlaps(box, other))) continue

      return placement
    }
  }

  return null
}
