// Generic HTTP plumbing shared by every feature's API client.
// Feature-specific endpoint functions belong in src/features/<feature>/api.ts.

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

// The API is served by the same Next.js app, so requests use relative paths ("/api/...").
const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. Check that the app is running.'

/** Sends a JSON request and turns any outcome into an ApiResult. */
export async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
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
