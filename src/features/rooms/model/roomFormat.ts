import type { Room } from '../types'

/** 400 × 300 cm becomes 12 m². */
export function formatArea(room: Pick<Room, 'widthCm' | 'lengthCm'>) {
  const area = (room.widthCm * room.lengthCm) / 10_000
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(area)} m²`
}
