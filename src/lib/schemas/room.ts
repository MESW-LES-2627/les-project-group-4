import { z } from 'zod'

import { checkLocation, locationFields } from '@/features/locations/schema'
import { MAX_INT } from '@/lib/validation'

const dimensionCm = z
  .int({ error: 'must be a whole number' })
  .positive({ error: 'must be greater than 0' })
  .max(MAX_INT, { error: 'is too large' })

/**
 * US-01: the rules for creating a room, shared by POST /api/rooms and the create-room form.
 * US-15: plus the optional location (see features/locations/schema.ts).
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
