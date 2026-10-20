// Types for the FurniMi REST API.
// This file is the frontend's single source of truth for the API shape.
// Field names must stay identical to the frozen contract in the epic
// (backend: CreateRoomRequest.java and RoomResponse.java).

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

/** Body returned by the backend with 400 Bad Request. */
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
