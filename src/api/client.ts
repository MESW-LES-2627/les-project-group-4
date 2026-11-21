import { toQueryString } from '@/lib/catalogFilters'
import { request, type ApiResult } from '@/lib/http'
import type { ListItemsQuery } from '@/lib/schemas/item'

import type {
  CatalogItem,
  CreateLayoutRequest,
  CreateRoomRequest,
  LayoutDetails,
  LayoutSummary,
  Room,
} from './types'

/** US-01: creates a room. Resolves with the created room (including its id) or an error. */
export function createRoom(room: CreateRoomRequest): Promise<ApiResult<Room>> {
  return request<Room>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(room),
  })
}

/** US-13: saves the current layout under a room. Resolves with the saved layout, or an error (409 for a duplicate name). */
export function saveLayout(
  roomId: number,
  layout: CreateLayoutRequest,
): Promise<ApiResult<LayoutDetails>> {
  return request<LayoutDetails>(`/api/rooms/${roomId}/layouts`, {
    method: 'POST',
    body: JSON.stringify(layout),
  })
}

/** US-14: the room's saved layouts, listed by name. */
export function listLayouts(roomId: number): Promise<ApiResult<LayoutSummary[]>> {
  return request<LayoutSummary[]>(`/api/rooms/${roomId}/layouts`, { method: 'GET' })
}

/** US-14: one saved layout with its items (404 if it does not exist in this room). */
export function getLayout(roomId: number, layoutId: number): Promise<ApiResult<LayoutDetails>> {
  return request<LayoutDetails>(`/api/rooms/${roomId}/layouts/${layoutId}`, { method: 'GET' })
}

/** US-14: deletes a saved layout. The server answers 204 with no body, so the data is null. */
export function deleteLayout(roomId: number, layoutId: number): Promise<ApiResult<null>> {
  return request<null>(`/api/rooms/${roomId}/layouts/${layoutId}`, { method: 'DELETE' })
}

/**
 * US-08: lists catalog items for a filter query. `signal` lets the caller abort a request
 * that a newer filter change has replaced (an aborted request resolves as a network error,
 * which the caller ignores because it is no longer the latest).
 */
export function listItems(
  query: ListItemsQuery,
  signal?: AbortSignal,
): Promise<ApiResult<CatalogItem[]>> {
  return request<CatalogItem[]>(`/api/items${toQueryString(query)}`, { method: 'GET', signal })
}
