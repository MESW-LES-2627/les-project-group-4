import type { Room } from '../types'

/** 400 × 300 cm becomes 12 m². */
export function formatArea(room: Pick<Room, 'widthCm' | 'lengthCm'>) {
  const area = (room.widthCm * room.lengthCm) / 10_000
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(area)} m²`
}

/** US-05 AT-2: what the delete confirmation says will be lost along with the room. */
export function describeRoomDeletion(layoutCount: number): string {
  if (layoutCount === 0) return 'This cannot be undone.'
  const layouts = layoutCount === 1 ? 'its saved layout' : `its ${layoutCount} saved layouts`
  return `This also deletes ${layouts}. This cannot be undone.`
}
