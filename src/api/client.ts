import type {
  ApiError,
  ApiResult,
  CreateRoomRequest,
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
    message = 'Not found. It may have been deleted, or the link is wrong.'
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

/**
 * US-03: loads one room by the id from the URL.
 * A missing room resolves with error.status 404; a malformed id with 400.
 */
export function getRoom(id: string): Promise<ApiResult<Room>> {
  return request<Room>(`/api/rooms/${encodeURIComponent(id)}`, { method: 'GET' })
}
