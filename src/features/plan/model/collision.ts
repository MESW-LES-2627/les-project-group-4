/**
 * US-11a — collision model: which placed items overlap each other and which
 * are outside the room. Pure functions, no UI; the plan highlight is US-11b.
 *
 * Item-vs-item overlap is exact for any rotation: footprints are convex
 * rectangles, so the separating axis theorem (SAT) only needs the two edge
 * directions of each rectangle. Touching edges or corners do not count as a
 * collision (same rule as the default placement), within EPSILON_CM.
 */

import { EPSILON_CM, footprintCorners, isInsideRoom } from '@/features/plan/model/geometry'
import type { Placement, Point, RoomSize, Size } from '@/features/plan/model/geometry'

/** What collision needs to know about a placed item. */
export interface CollisionItem extends Size, Placement {
  id: string
}

/** AT-1..AT-5: the ids to flag on the plan. Both lists keep the input order. */
export interface CollisionReport {
  /** Items that overlap at least one other item. */
  colliding: string[]
  /** Items that are partly or fully outside the room. */
  outOfBounds: string[]
}

/** The two edge directions of a rectangle; the other two edges are parallel. */
function edgeAxes(corners: Point[]): Point[] {
  return [0, 1].map((i) => {
    const a = corners[i]
    const b = corners[i + 1]
    // The normal of the edge a→b. Its length does not matter for the test below.
    return { x: -(b.y - a.y), y: b.x - a.x }
  })
}

function project(corners: Point[], axis: Point): { min: number; max: number } {
  const values = corners.map((p) => p.x * axis.x + p.y * axis.y)
  return { min: Math.min(...values), max: Math.max(...values) }
}

/**
 * AT-1..AT-4: true when the two footprints share area. They are apart as soon
 * as one axis separates their projections; touching (a gap of 0) is apart too.
 */
export function footprintsOverlap(a: Size & Placement, b: Size & Placement): boolean {
  // A footprint with no area cannot share area (and has no edge to project on).
  if (Math.min(a.widthCm, a.depthCm, b.widthCm, b.depthCm) <= EPSILON_CM) return false

  const ca = footprintCorners(a, a)
  const cb = footprintCorners(b, b)

  for (const axis of [...edgeAxes(ca), ...edgeAxes(cb)]) {
    const length = Math.hypot(axis.x, axis.y)
    const unit = { x: axis.x / length, y: axis.y / length }
    const pa = project(ca, unit)
    const pb = project(cb, unit)
    if (pa.max <= pb.min + EPSILON_CM || pb.max <= pa.min + EPSILON_CM) return false
  }
  return true
}

/**
 * AT-1..AT-5: every item that overlaps another one, and every item that is not
 * fully inside the room (touching a wall is inside). O(n²), which is fine for a
 * room's worth of furniture.
 */
export function findCollisions(items: readonly CollisionItem[], room: RoomSize): CollisionReport {
  const hit = new Set<string>()

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (footprintsOverlap(items[i], items[j])) {
        hit.add(items[i].id)
        hit.add(items[j].id)
      }
    }
  }

  return {
    colliding: items.filter((item) => hit.has(item.id)).map((item) => item.id),
    outOfBounds: items.filter((item) => !isInsideRoom(item, item, room)).map((item) => item.id),
  }
}
