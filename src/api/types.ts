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

/** US-13: one placed item in the body of POST /api/rooms/[id]/layouts. Sizes and price come from the catalog. */
export interface CreateLayoutItemRequest {
  catalogItemId: number
  xCm: number
  yCm: number
  rotationDeg: number
}

/** US-13: body sent to POST /api/rooms/[id]/layouts. */
export interface CreateLayoutRequest {
  name: string
  items: CreateLayoutItemRequest[]
}

/**
 * US-13 / US-14: one item of a saved layout, in the same shape as PlacedItem (src/lib/layout/layout.ts)
 * except that `id` is the saved row id. `priceCents` is the catalog price when the layout was saved.
 */
export interface SavedLayoutItem {
  id: number
  catalogItemId: number
  name: string
  widthCm: number
  depthCm: number
  priceCents: number
  xCm: number
  yCm: number
  rotationDeg: number
}

/** US-14: one entry of GET /api/rooms/[id]/layouts. `updatedAt` is an ISO 8601 string. */
export interface LayoutSummary {
  id: number
  name: string
  itemCount: number
  updatedAt: string
}

/** US-13 / US-14: returned by POST /api/rooms/[id]/layouts (201) and GET /api/rooms/[id]/layouts/[layoutId]. */
export interface LayoutDetails {
  id: number
  roomId: number
  name: string
  createdAt: string
  updatedAt: string
  items: SavedLayoutItem[]
}

/** Body returned by the API with 400 Bad Request (and 409 Conflict for a duplicate layout name). */
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
