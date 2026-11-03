import type { Room } from '@/api/types'

/** What the UI shows for coordinates that have no city (AT-2: no reverse geocoding). */
export const CURRENT_LOCATION_LABEL = 'Current location'

export interface Coordinates {
  latitude: number
  longitude: number
}

type RoomLocation = Pick<Room, 'city' | 'latitude' | 'longitude'>

/**
 * US-15: the label for a room's saved location: the city name, "Current location" for
 * browser coordinates, or null when the room has no location.
 */
export function formatRoomLocation(room: RoomLocation): string | null {
  if (room.city !== null) {
    return room.city.name
  }
  if (room.latitude !== null && room.longitude !== null) {
    return CURRENT_LOCATION_LABEL
  }
  return null
}

/**
 * US-15 AT-5: the saved location as coordinates, so later features (e.g. nearby stores)
 * reuse it without asking again. A city uses its seeded coordinates.
 */
export function getRoomCoordinates(room: RoomLocation): Coordinates | null {
  if (room.city !== null) {
    return { latitude: room.city.latitude, longitude: room.city.longitude }
  }
  if (room.latitude !== null && room.longitude !== null) {
    return { latitude: room.latitude, longitude: room.longitude }
  }
  return null
}
