import type { ValidationErrorBody } from '@/lib/http'

export const ROOM_NOT_FOUND = { message: 'Room not found.' } as const
export const LAYOUT_NOT_FOUND = { message: 'Layout not found.' } as const

/** The API's 400/409 body for field-level validation errors. */
export function validationError(errors: Record<string, string>, status = 400) {
  return Response.json({ errors } satisfies ValidationErrorBody, { status })
}

/** Logs the real error on the server and returns the generic message to the client. */
export function serverError(context: string, message: string, error: unknown) {
  console.error(context, error)
  return Response.json({ message }, { status: 500 })
}
