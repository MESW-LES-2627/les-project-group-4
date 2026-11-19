import { toQueryString } from '@/lib/catalogFilters'
import type { ListItemsQuery } from '@/lib/schemas/item'

import type {
  ApiError,
  ApiResult,
  CatalogItem,
  CreateLayoutRequest,
  CreateRoomRequest,
  LayoutDetails,
  LayoutSummary,
  Room,
  ValidationErrorBody,
} from './types'

// The API is served by the same Next.js app, so requests use relative paths ("/api/...").
const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. Check that the app is running.'

/** Sends a JSON request and turns any outcome into an ApiResult. */
async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  } catch {
    // fetch only rejects when no HTTP response arrived at all (offline, DNS).
    return { ok: false, error: { status: 0, message: NETWORK_ERROR_MESSAGE, fieldErrors: {} } }
  }

  const body = await readJsonSafely(response)

  if (response.ok) {
    return { ok: true, data: body as T }
  }
  return { ok: false, error: toApiError(response.status, body) }
}

/** Reads the body as JSON; returns null for an empty or non-JSON body. */
async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === '') {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Checks at runtime that a body has the { errors: { field: message } } shape. */
function isValidationErrorBody(body: unknown): body is ValidationErrorBody {
  if (typeof body !== 'object' || body === null || !('errors' in body)) {
    return false
  }
  const errors = (body as { errors: unknown }).errors
  return (
    typeof errors === 'object' &&
    errors !== null &&
    Object.values(errors).every((value) => typeof value === 'string')
  )
}

/** Maps a non-2xx response to the single ApiError shape the UI understands. */
function toApiError(status: number, body: unknown): ApiError {
  const fieldErrors = isValidationErrorBody(body) ? body.errors : {}

  let message: string
  if (status === 400) {
    message = 'Some fields are invalid. Please correct them and try again.'
  } else if (status === 404) {
    message = 'It was not found. It may have been deleted.'
  } else if (status === 409) {
    // US-13 AT-6: the field message (e.g. the duplicate layout name) is the one to show.
    message = Object.values(fieldErrors)[0] ?? 'This conflicts with existing data.'
  } else if (status >= 500) {
    message = 'The server is unavailable right now. Please try again later.'
  } else {
    message = `Unexpected response from the server (HTTP ${status}).`
  }

  return { status, message, fieldErrors }
}

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
