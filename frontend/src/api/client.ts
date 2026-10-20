import type {
  ApiError,
  ApiResult,
  CreateRoomRequest,
  Room,
  ValidationErrorBody,
} from './types'

// Empty by default, so requests go to the same origin ("/api/...") and the
// Vite dev proxy forwards them to the backend. Set VITE_API_BASE_URL to call
// a backend on another host (for example a staging server).
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. Check that the backend is running.'

/** Sends a JSON request and turns any outcome into an ApiResult. */
async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  } catch {
    // fetch only rejects when no HTTP response arrived at all (offline, DNS, CORS).
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
  } else if (status >= 500) {
    // The Vite proxy also answers 5xx when the backend is down.
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
