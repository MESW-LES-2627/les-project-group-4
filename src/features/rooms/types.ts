// Types for the rooms API.
// Field names must stay identical to the frozen contract in the epic
// (served by the route handlers under src/app/api/rooms).

import type { City } from '@/features/locations/types'

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

/** US-04: body sent to PATCH /api/rooms/[id]. Same rules as create, without the location. */
export interface UpdateRoomRequest {
  name: string
  widthCm: number
  lengthCm: number
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
 * US-13 / US-14: one item of a saved layout, in the same shape as PlacedItem
 * (features/plan/model/layout.ts) except that `id` is the saved row id.
 * `priceCents` is the catalog price when the layout was saved.
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

/**
 * US-14b: a saved layout with its items, for the room page's preview cards.
 * The list API keeps returning the lighter LayoutSummary; the room page loads
 * the items so each card can draw a miniature of the saved plan.
 */
export interface LayoutWithItems extends LayoutSummary {
  items: SavedLayoutItem[]
}
