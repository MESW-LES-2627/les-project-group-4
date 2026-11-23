import { roomLocationSchema } from '../schema'
import type { RoomLocationInput } from '../schema'

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
