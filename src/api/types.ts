// Types for the FurniMi REST API.
// This file is the frontend's single source of truth for the API shape.
// Field names must stay identical to the frozen contract in the epic
// (served by the route handlers under src/app/api).

/** Body sent to POST /api/rooms. */
export interface CreateRoomRequest {
  name: string
  widthCm: number
  lengthCm: number
}

/** Body returned by POST /api/rooms with 201 Created. */
export interface Room {
  id: number
  name: string
  widthCm: number
  lengthCm: number
}

/** One catalog item, as returned by GET /api/items (US-07). Sizes in cm, price in euro cents. */
export interface CatalogItem {
  id: number
  slug: string
  name: string
  category: string
  widthCm: number
  depthCm: number
  heightCm: number | null
  priceCents: number
  styleTags: string[]
  roomTypeTags: string[]
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
