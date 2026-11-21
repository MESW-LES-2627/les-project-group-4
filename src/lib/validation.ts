import { z } from 'zod'

// Postgres INTEGER is 32-bit; a bigger value would make the insert fail with a 500 instead of a 400.
export const MAX_INT = 2_147_483_647

/** A database id: a positive whole number that fits in a Postgres INTEGER. */
export const idSchema = z
  .int({ error: 'must be a whole number' })
  .positive({ error: 'must be greater than 0' })
  .max(MAX_INT, { error: 'is too large' })

/**
 * Turns a Zod error into the API's { field: message } map, keeping the first message per field.
 * Issues that are not about a single field (e.g. the body is not an object) go under "body".
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : 'body'
    errors[field] ??= issue.message
  }
  return errors
}
