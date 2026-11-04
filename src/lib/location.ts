import { z } from 'zod'

import type { Room } from '@/api/types'
import type { RoomLocationInput } from '@/lib/roomValidation'

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

/** AT-5: the location of a saved room, in the shape the create-room form sends. */
export function toLocationInput(room: RoomLocation): RoomLocationInput {
  if (room.city !== null) {
    return { cityId: room.city.id }
  }
  if (room.latitude !== null && room.longitude !== null) {
    return { latitude: room.latitude, longitude: room.longitude }
  }
  return {}
}

// AT-5: the browser remembers the last room's location so the next room starts with it.
// It is only a convenience: the room itself (in the database) is the source of truth.
const LAST_LOCATION_KEY = 'furnimi:last-location'

const savedLocationSchema = z.union([
  z.object({ cityId: z.int().positive() }).strict(),
  z
    .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
    .strict(),
])

/** Parses what was stored; anything missing, old or tampered with gives no location. */
export function parseSavedLocation(raw: string | null): RoomLocationInput {
  if (raw === null) {
    return {}
  }
  try {
    const parsed = savedLocationSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

/** Reads the last location. Storage can be blocked (private mode), so it never throws. */
export function loadLastLocation(): RoomLocationInput {
  try {
    return parseSavedLocation(window.localStorage.getItem(LAST_LOCATION_KEY))
  } catch {
    return {}
  }
}

/** Remembers the last location; a room without one clears it. Never throws. */
export function saveLastLocation(location: RoomLocationInput): void {
  try {
    if (Object.keys(location).length === 0) {
      window.localStorage.removeItem(LAST_LOCATION_KEY)
    } else {
      window.localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location))
    }
  } catch {
    // Storage is unavailable: the next room simply starts without a location.
  }
}
