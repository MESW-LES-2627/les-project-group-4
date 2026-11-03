import { z } from 'zod'

// Postgres INTEGER is 32-bit; a bigger value would make the insert fail with a 500 instead of a 400.
const MAX_INT = 2_147_483_647

const dimensionCm = z
  .int({ error: 'must be a whole number' })
  .positive({ error: 'must be greater than 0' })
  .max(MAX_INT, { error: 'is too large' })

/** A database id: a positive whole number that fits in a Postgres INTEGER. */
const idSchema = z
  .int({ error: 'must be a whole number' })
  .positive({ error: 'must be greater than 0' })
  .max(MAX_INT, { error: 'is too large' })

// US-15: browser coordinates in decimal degrees. z.number() already rejects NaN and Infinity.
const latitudeSchema = z
  .number({ error: 'must be a number' })
  .min(-90, { error: 'must be between -90 and 90' })
  .max(90, { error: 'must be between -90 and 90' })

const longitudeSchema = z
  .number({ error: 'must be a number' })
  .min(-180, { error: 'must be between -180 and 180' })
  .max(180, { error: 'must be between -180 and 180' })

/**
 * US-01: the rules for creating a room, shared by POST /api/rooms and the create-room form.
 * US-15: the location is optional: a `cityId`, or `latitude` + `longitude` together, never both.
 * Whether the city exists is checked by the route (it needs the database).
 */
export const createRoomSchema = z
  .object(
    {
      name: z
        .string({ error: 'is required' })
        .trim()
        .min(1, { error: 'is required' })
        .max(255, { error: 'must be at most 255 characters' }),
      widthCm: dimensionCm,
      lengthCm: dimensionCm,
      cityId: idSchema.optional(),
      latitude: latitudeSchema.optional(),
      longitude: longitudeSchema.optional(),
    },
    { error: 'must be a JSON object' },
  )
  .superRefine((room, ctx) => {
    const hasLatitude = room.latitude !== undefined
    const hasLongitude = room.longitude !== undefined
    if (hasLatitude && !hasLongitude) {
      ctx.addIssue({ code: 'custom', path: ['longitude'], message: 'is required with latitude' })
    }
    if (hasLongitude && !hasLatitude) {
      ctx.addIssue({ code: 'custom', path: ['latitude'], message: 'is required with longitude' })
    }
    if (room.cityId !== undefined && (hasLatitude || hasLongitude)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cityId'],
        message: 'choose a city or your current location, not both',
      })
    }
  })

export type CreateRoomInput = z.infer<typeof createRoomSchema>

/** US-03: a room id from the URL. Only positive whole numbers that fit in a Postgres INTEGER. */
export const roomIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, { error: 'must be a positive whole number' })
  .transform(Number)
  .pipe(z.int().max(MAX_INT, { error: 'is too large' }))

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
