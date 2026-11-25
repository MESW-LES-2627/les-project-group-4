import { z } from 'zod'

import { checkLocation, locationFields } from '@/features/locations/schema'
import { MAX_INT } from '@/lib/validation'

/** The longest room name the form and the API accept. */
export const ROOM_NAME_MAX = 255

const dimensionCm = z
  .int({ error: 'must be a whole number' })
  .positive({ error: 'must be greater than 0' })
  .max(MAX_INT, { error: 'is too large' })

/** US-01 / US-04: the name and dimensions, with the same rules when creating and editing. */
const roomFields = {
  name: z
    .string({ error: 'is required' })
    .trim()
    .min(1, { error: 'is required' })
    .max(ROOM_NAME_MAX, { error: `must be at most ${ROOM_NAME_MAX} characters` }),
  widthCm: dimensionCm,
  lengthCm: dimensionCm,
}

/**
 * US-01: the rules for creating a room, shared by POST /api/rooms and the create-room form.
 * US-15: plus the optional location (see features/locations/schema.ts).
 * Whether the city exists is checked by the route (it needs the database).
 */
export const createRoomSchema = z
  .object(
    {
      ...roomFields,
      ...locationFields,
    },
    { error: 'must be a JSON object' },
  )
  .superRefine(checkLocation)

export type CreateRoomInput = z.infer<typeof createRoomSchema>

/**
 * US-04: the body of PATCH /api/rooms/[id]. The edit form always sends the name and both
 * dimensions, with the same rules as create (AT-2). The location is not edited here.
 */
export const updateRoomSchema = z.object(roomFields, { error: 'must be a JSON object' })

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>

/** US-03: a room id from the URL. Only positive whole numbers that fit in a Postgres INTEGER. */
export const roomIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, { error: 'must be a positive whole number' })
  .transform(Number)
  .pipe(z.int().max(MAX_INT, { error: 'is too large' }))

/** US-13: the longest layout name the `layout.name` column (VARCHAR(100)) accepts. */
export const LAYOUT_NAME_MAX = 100

/** US-13: at most this many items per saved layout, so one request cannot insert an unbounded number of rows. */
export const LAYOUT_ITEMS_MAX = 200

/** US-13 AT-6: the message shown when a room already has a layout with the same name. */
export const DUPLICATE_LAYOUT_NAME = 'A layout with this name already exists'

/** A coordinate or angle from the plan. z.number() already rejects NaN and Infinity. */
const finiteNumber = z.number({ error: 'must be a number' })

/**
 * US-13: one placed item, as the plan stores it (field names match Placement in
 * features/plan/model/geometry.ts and catalogItemId in features/plan/model/layout.ts).
 * The price is not sent: the server copies it from the catalog when the layout is saved.
 */
const layoutItemSchema = z
  .object(
    {
      catalogItemId: z
        .int({ error: 'must be a whole number' })
        .positive({ error: 'must be greater than 0' })
        .max(MAX_INT, { error: 'is too large' }),
      xCm: finiteNumber,
      yCm: finiteNumber,
      rotationDeg: finiteNumber,
    },
    { error: 'must be an object' },
  )
  .strict()

/**
 * US-13: the body of POST /api/rooms/[id]/layouts, shared by the route and the save dialog.
 * AT-1 / AT-4: the name is required (blank after trimming is rejected).
 * Whether the room and the catalog items exist is checked by the route (it needs the database).
 */
export const createLayoutSchema = z
  .object(
    {
      name: z
        .string({ error: 'is required' })
        .trim()
        .min(1, { error: 'is required' })
        .max(LAYOUT_NAME_MAX, { error: `must be at most ${LAYOUT_NAME_MAX} characters` }),
      items: z
        .array(layoutItemSchema, { error: 'must be a list' })
        .max(LAYOUT_ITEMS_MAX, { error: `must have at most ${LAYOUT_ITEMS_MAX} items` }),
    },
    { error: 'must be a JSON object' },
  )
  .strict()

export type CreateLayoutInput = z.infer<typeof createLayoutSchema>

/** US-14: a layout id from the URL, with the same rules as a room id. */
export const layoutIdSchema = roomIdSchema
