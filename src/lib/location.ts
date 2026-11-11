import type { City, Room } from '@/api/types'
import { roomLocationSchema } from '@/lib/schemas/room'
import type { RoomLocationInput } from '@/lib/schemas/room'

/** What the UI shows for coordinates that have no city (AT-2: no reverse geocoding). */
export const CURRENT_LOCATION_LABEL = 'Your location'

export interface Coordinates {
  latitude: number
  longitude: number
}

type RoomLocation = Pick<Room, 'city' | 'latitude' | 'longitude'>

/** US-15: a saved room's location, in one place: a city, browser coordinates, or none. */
export type ResolvedLocation =
  | { kind: 'city'; city: City }
  | ({ kind: 'coordinates' } & Coordinates)
  | { kind: 'none' }

/** The single "city, else coordinates, else none" rule; the helpers below all use it. */
export function resolveRoomLocation(room: RoomLocation): ResolvedLocation {
  if (room.city !== null) {
    return { kind: 'city', city: room.city }
  }
  if (room.latitude !== null && room.longitude !== null) {
    return { kind: 'coordinates', latitude: room.latitude, longitude: room.longitude }
  }
  return { kind: 'none' }
}

/**
 * US-15: the label for a room's saved location: the city name, "Current location" for
 * browser coordinates, or null when the room has no location.
 */
export function formatRoomLocation(room: RoomLocation): string | null {
  const location = resolveRoomLocation(room)
  switch (location.kind) {
    case 'city':
      return location.city.name
    case 'coordinates':
      return CURRENT_LOCATION_LABEL
    case 'none':
      return null
  }
}

/**
 * US-15 AT-5: the saved location as coordinates, so later features (e.g. nearby stores)
 * reuse it without asking again. A city uses its seeded coordinates.
 */
export function getRoomCoordinates(room: RoomLocation): Coordinates | null {
  const location = resolveRoomLocation(room)
  switch (location.kind) {
    case 'city':
      return { latitude: location.city.latitude, longitude: location.city.longitude }
    case 'coordinates':
      return { latitude: location.latitude, longitude: location.longitude }
    case 'none':
      return null
  }
}

/** AT-5: the location of a saved room, in the shape the create-room form sends. */
export function toLocationInput(room: RoomLocation): RoomLocationInput {
  const location = resolveRoomLocation(room)
  switch (location.kind) {
    case 'city':
      return { cityId: location.city.id }
    case 'coordinates':
      return { latitude: location.latitude, longitude: location.longitude }
    case 'none':
      return {}
  }
}

// AT-5: the browser remembers the last room's location so the next room starts with it.
// It is only a convenience: the room itself (in the database) is the source of truth.
const LAST_LOCATION_KEY = 'furnimi:last-location'

/**
 * Parses what was stored with the same schema as POST /api/rooms (roomLocationSchema);
 * anything missing, old or tampered with gives no location.
 */
export function parseSavedLocation(raw: string | null): RoomLocationInput {
  if (raw === null) {
    return {}
  }
  try {
    const parsed = roomLocationSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

/** The stored last location as text, or null. Storage can be blocked (private mode), so it never throws. */
export function readLastLocationRaw(): string | null {
  try {
    return window.localStorage.getItem(LAST_LOCATION_KEY)
  } catch {
    return null
  }
}

/** Reads the last location; anything unreadable gives no location. */
export function loadLastLocation(): RoomLocationInput {
  return parseSavedLocation(readLastLocationRaw())
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
