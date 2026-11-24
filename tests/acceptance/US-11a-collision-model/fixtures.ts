import type { CollisionItem } from '@/features/plan/model/collision'
import type { RoomSize } from '@/features/plan/model/geometry'

/** A 6 m × 4 m room: every item below fits inside it unless a test moves it out. */
export const room: RoomSize = { widthCm: 600, lengthCm: 400 }

/** A footprint with an id, centred at (xCm, yCm). */
export function item(
  id: string,
  widthCm: number,
  depthCm: number,
  xCm: number,
  yCm: number,
  rotationDeg = 0,
): CollisionItem {
  return { id, widthCm, depthCm, xCm, yCm, rotationDeg }
}

/** A 1 m × 1 m square, e.g. a small table. */
export const square = (id: string, xCm: number, yCm: number, rotationDeg = 0) =>
  item(id, 100, 100, xCm, yCm, rotationDeg)
