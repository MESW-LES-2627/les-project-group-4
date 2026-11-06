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

/**
 * US-15: decimals kept from the browser's coordinates. 3 decimals is about 110 m: enough
 * for "stores near me" (US-17), without storing (and serving, since GET /api/rooms has no
 * login) where the user was to the metre.
 */
export const COORDINATE_DECIMALS = 3

/** Rounds a coordinate to COORDINATE_DECIMALS, never returning -0. */
export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS
  return Math.round(value * factor) / factor + 0
}

// US-15: browser coordinates in decimal degrees. z.number() already rejects NaN and Infinity.
// The range is checked on the exact value, then the value is rounded before it is saved.
const latitudeSchema = z
  .number({ error: 'must be a number' })
  .min(-90, { error: 'must be between -90 and 90' })
  .max(90, { error: 'must be between -90 and 90' })
  .transform(roundCoordinate)

const longitudeSchema = z
  .number({ error: 'must be a number' })
  .min(-180, { error: 'must be between -180 and 180' })
  .max(180, { error: 'must be between -180 and 180' })
  .transform(roundCoordinate)

// US-15: the optional location fields, shared by createRoomSchema and roomLocationSchema.
const locationFields = {
  cityId: idSchema.optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
}

/** US-15: a `cityId`, or `latitude` + `longitude` together, never both (the DB checks it too). */
function checkLocation(
  location: { cityId?: number; latitude?: number; longitude?: number },
  ctx: z.RefinementCtx,
) {
  const hasLatitude = location.latitude !== undefined
  const hasLongitude = location.longitude !== undefined
  if (hasLatitude && !hasLongitude) {
    ctx.addIssue({ code: 'custom', path: ['longitude'], message: 'is required with latitude' })
  }
  if (hasLongitude && !hasLatitude) {
    ctx.addIssue({ code: 'custom', path: ['latitude'], message: 'is required with longitude' })
  }
  if (location.cityId !== undefined && (hasLatitude || hasLongitude)) {
    ctx.addIssue({
      code: 'custom',
      path: ['cityId'],
      message: 'choose a city or your current location, not both',
    })
  }
}

/**
 * US-15: just the location, with the same rules as POST /api/rooms. The create-room form uses
 * it for the location it remembers in the browser (AT-5), so both can never drift apart.
 */
export const roomLocationSchema = z.object(locationFields).strict().superRefine(checkLocation)

/** US-15: an empty object (no location), a city, or browser coordinates. */
export type RoomLocationInput = z.input<typeof roomLocationSchema>

/**
 * US-01: the rules for creating a room, shared by POST /api/rooms and the create-room form.
 * US-15: plus the optional location (see roomLocationSchema).
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
      ...locationFields,
    },
    { error: 'must be a JSON object' },
  )
  .superRefine(checkLocation)

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
