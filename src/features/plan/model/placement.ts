/**
 * US-09 — default placement: shelf-pack new items against the top wall, left to
 * right, wrapping to the next row; upright (0°) first, then 90°. Coordinates
 * and the centre-based contract are in ./geometry.ts.
 *
 * Candidates are the walls plus the bottom/right edges of existing items; the
 * first free spot wins (margin 0, touching allowed). Existing items are never
 * moved. Overlap here uses AABBs, which is exact because new items are only
 * placed at 0°/90°; exact overlap at any angle (SAT) is in ./collision.ts (US-11a).
 */

import { EPSILON_CM, boundingBox, isInsideRoom } from '@/features/plan/model/geometry'
import type { Box, Placement, RoomSize, Size } from '@/features/plan/model/geometry'

/** A footprint already in the room: its size and where it sits. */
export type PlacedFootprint = Size & Placement

/** How far from each wall new items are placed. Flush for now (AT-2). */
export const PLACEMENT_MARGIN_CM = 0

/** AT-5: the message the UI shows when no placement exists. */
export const DOES_NOT_FIT_MESSAGE = "Doesn't fit this room"

/** Upright first; a quarter turn only when nothing upright fits. */
const ROTATIONS = [0, 90] as const

/**
 * The placement that puts the footprint's bounding box at (leftCm, topCm).
 * A quarter turn swaps width and depth, and the footprint stays centred on the
 * placement point, so the centre is the bounding box's half-size from the corner.
 */
function placementAt(
  size: Size,
  leftCm: number,
  topCm: number,
  rotationDeg: number,
): Placement {
  const turned = rotationDeg === 90
  return {
    xCm: leftCm + (turned ? size.depthCm : size.widthCm) / 2,
    yCm: topCm + (turned ? size.widthCm : size.depthCm) / 2,
    rotationDeg,
  }
}

/** True when two boxes share area. Touching edges do not count as a conflict. */
export function overlaps(a: Box, b: Box): boolean {
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
 * The default placement for an item, or null when it fits neither upright nor
 * rotated. The scan is deterministic: 0° everywhere first, then 90° everywhere,
 * top-most row first and left-most free spot first.
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

  for (const rotationDeg of ROTATIONS) {
    for (const topCm of rowTops) {
      for (const leftCm of leftEdges) {
        const placement = placementAt(size, leftCm, topCm, rotationDeg)
        if (!isInsideRoom(size, placement, room, PLACEMENT_MARGIN_CM)) continue

        const box = boundingBox(size, placement)
        if (boxes.some((other) => overlaps(box, other))) continue

        return placement
      }
    }
  }

  return null
}
