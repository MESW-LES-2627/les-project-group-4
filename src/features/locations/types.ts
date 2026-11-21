/** US-15: a seeded city, returned by GET /api/cities and inside a Room. */
export interface City {
  id: number
  name: string
  latitude: number
  longitude: number
}

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * The location-bearing fields of a room. Structural on purpose: locations must
 * not import the Room type.
 */
export interface LocatedRoom {
  city: City | null
  latitude: number | null
  longitude: number | null
}
