/**
 * US-06b — Plan geometry contract (single source of truth for US-06a, US-10, US-11, US-12).
 *
 * Coordinate system (plan-review.md #6):
 *   - Units are centimetres everywhere in data and logic.
 *   - Origin (0, 0) is the room's TOP-LEFT corner; x grows to the right, y grows DOWN.
 *   - A placement's (xCm, yCm) is the CENTRE of the item's footprint.
 *   - rotationDeg turns the item CLOCKWISE as seen on the plan (y-down screen).
 *   - The renderer (R3F) maps x -> x, y -> z, metres = cm / 100, rotation around Y.
 */

export interface Size {
  widthCm: number // along x when rotationDeg = 0
  depthCm: number // along y when rotationDeg = 0
}

export interface RoomSize {
  widthCm: number // along x
  lengthCm: number // along y
}

export interface Placement {
  xCm: number
  yCm: number
  rotationDeg: number
}

export interface Point {
  x: number
  y: number
}

export interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Floating-point tolerance in cm (1e-6 cm = 0.00001 mm = 10 nm): treats 299.9999999 as 300. */
export const EPSILON_CM = 1e-6

/** Any angle -> [0, 360). -90 -> 270, 450 -> 90. */
export function normalizeRotation(deg: number): number {
  const r = deg % 360
  return r < 0 ? r + 360 : r + 0 // +0 to convert -0 to +0
}

const toRad = (deg: number) => (deg * Math.PI) / 180

/**
 * The four corners of the item's footprint, in room cm, clockwise from the
 * (unrotated) top-left corner. In a y-down system the standard rotation
 * formula x' = x·cos − y·sin, y' = x·sin + y·cos turns points CLOCKWISE on screen.
 */
export function footprintCorners(size: Size, placement: Placement): Point[] {
  const hw = size.widthCm / 2
  const hd = size.depthCm / 2
  const a = toRad(normalizeRotation(placement.rotationDeg))
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const local: Point[] = [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ]
  return local.map(({ x, y }) => ({
    x: placement.xCm + x * cos - y * sin,
    y: placement.yCm + x * sin + y * cos,
  }))
}

/**
    * Axis-aligned bounding box of the rotated footprint.
    * Exact for the room-containment check (the room is axis-aligned).
    * NOT for item-vs-item overlap (#33): two rotated items can have overlapping
    * boxes while their footprints don't touch — use SAT on footprintCorners there.
    */

export function boundingBox(size: Size, placement: Placement): Box {
  const pts = footprintCorners(size, placement)
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

/** The room rectangle's corners, clockwise from the origin. */
export function roomOutline(room: RoomSize): Point[] {
  return [
    { x: 0, y: 0 },
    { x: room.widthCm, y: 0 },
    { x: room.widthCm, y: room.lengthCm },
    { x: 0, y: room.lengthCm },
  ]
}

/**
 * True when every corner of the footprint is inside the room, keeping `marginCm`
 * from each wall. Touching a wall exactly is allowed (furniture against a wall).
 * Because the room is a rectangle and the footprint is convex, checking the
 * corners is enough.
 */
export function isInsideRoom(size: Size, placement: Placement, room: RoomSize, marginCm = 0): boolean {
  const box = boundingBox(size, placement)
  return (
    box.minX >= marginCm - EPSILON_CM &&
    box.minY >= marginCm - EPSILON_CM &&
    box.maxX <= room.widthCm - marginCm + EPSILON_CM &&
    box.maxY <= room.lengthCm - marginCm + EPSILON_CM
  )
}

/**
 * Can the item fit the room at all? Tries 0° then 90° (plan-review #6) and
 * returns the first rotation that fits when centred, or null if neither does.
 * Example: 200×100 in a 120×210 room -> 90. 200×100 in 150×150 -> null.
 */
export function findFittingRotation(size: Size, room: RoomSize, marginCm = 0): 0 | 90 | null {
  const centre = { xCm: room.widthCm / 2, yCm: room.lengthCm / 2 }
  for (const rotationDeg of [0, 90] as const) {
    if (isInsideRoom(size, { ...centre, rotationDeg }, room, marginCm)) return rotationDeg
  }
  return null
}

/** Plan cm -> R3F scene (metres). Clockwise on the plan = negative angle around +Y. */
export function toScene(placement: Placement): { x: number; z: number; rotationY: number } {
  return {
    x: placement.xCm / 100,
    z: placement.yCm / 100,
    rotationY: -toRad(normalizeRotation(placement.rotationDeg)),
  }
}

/** Footprint size in scene metres (box geometry args: width along x, depth along z). */
export function sizeToScene(size: Size): { width: number; depth: number } {
  return { width: size.widthCm / 100, depth: size.depthCm / 100 }
}
