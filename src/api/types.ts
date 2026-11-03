// Types for the FurniMi REST API.
// This file is the frontend's single source of truth for the API shape.
// Field names must stay identical to the frozen contract in the epic
// (served by the route handlers under src/app/api).

/**
 * Body sent to POST /api/rooms.
 * US-15: the location is optional: either `cityId`, or `latitude` + `longitude`, never both.
 */
export interface CreateRoomRequest {
  name: string
  widthCm: number
  lengthCm: number
  cityId?: number
  latitude?: number
  longitude?: number
}

/** US-15: a seeded city, returned by GET /api/cities and inside a Room. */
export interface City {
  id: number
  name: string
  latitude: number
  longitude: number
}

/** Body returned by POST /api/rooms with 201 Created, GET /api/rooms and GET /api/rooms/[id]. */
export interface Room {
  id: number
  name: string
  widthCm: number
  lengthCm: number
  /** US-15: the chosen city, or null. */
  city: City | null
  /** US-15: the browser's coordinates when the user chose "Use my location", otherwise null. */
  latitude: number | null
  longitude: number | null
}

/** Body returned by the API with 400 Bad Request. */
export interface ValidationErrorBody {
  errors: Record<string, string>
}

/** The one error shape the UI ever has to handle. */
export interface ApiError {
  /** HTTP status code, or 0 when the server could not be reached. */
  status: number
  /** A message that can be shown to the user as-is. */
  message: string
  /** Messages per form field, e.g. { widthCm: "must be greater than 0" }. Empty if none. */
  fieldErrors: Record<string, string>
}

/** Every client call resolves to either data or an error; it never throws. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }
