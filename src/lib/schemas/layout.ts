import { z } from 'zod'

import { roomIdSchema } from '@/lib/schemas/room'

// Postgres INTEGER is 32-bit; a bigger id would make the query fail with a 500 instead of a 400.
const MAX_INT = 2_147_483_647

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
 * src/lib/geometry/plan.ts and catalogItemId in src/lib/layout/layout.ts).
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
