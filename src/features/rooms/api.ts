import { request, type ApiResult } from '@/lib/http'

import type {
  CreateLayoutRequest,
  CreateRoomRequest,
  LayoutDetails,
  Room,
  UpdateRoomRequest,
} from './types'

/** US-01: creates a room. Resolves with the created room (including its id) or an error. */
export function createRoom(room: CreateRoomRequest): Promise<ApiResult<Room>> {
  return request<Room>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(room),
  })
}

/** US-04: saves a room's new name and dimensions. Resolves with the updated room, or an error (400 with field errors, 404). */
export function updateRoom(roomId: number, room: UpdateRoomRequest): Promise<ApiResult<Room>> {
  return request<Room>(`/api/rooms/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(room),
  })
}

/** US-05: deletes a room and its saved layouts. The server answers 204 with no body, so the data is null. */
export function deleteRoom(roomId: number): Promise<ApiResult<null>> {
  return request<null>(`/api/rooms/${roomId}`, { method: 'DELETE' })
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

/** US-14: one saved layout with its items (404 if it does not exist in this room). */
export function getLayout(roomId: number, layoutId: number): Promise<ApiResult<LayoutDetails>> {
  return request<LayoutDetails>(`/api/rooms/${roomId}/layouts/${layoutId}`, { method: 'GET' })
}

/** US-14: deletes a saved layout. The server answers 204 with no body, so the data is null. */
export function deleteLayout(roomId: number, layoutId: number): Promise<ApiResult<null>> {
  return request<null>(`/api/rooms/${roomId}/layouts/${layoutId}`, { method: 'DELETE' })
}
