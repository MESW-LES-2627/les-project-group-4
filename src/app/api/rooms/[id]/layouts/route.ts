import { findItemPrices } from '@/features/catalog/server/items'
import {
  createLayoutSchema,
  DUPLICATE_LAYOUT_NAME,
  roomIdSchema,
} from '@/features/rooms/schema'
import {
  createLayout,
  findLayouts,
  isUniqueViolation,
  roomExists,
} from '@/features/rooms/server/layouts'
import type { ValidationErrorBody } from '@/lib/http'
import { toFieldErrors } from '@/lib/validation'

type Context = { params: Promise<{ id: string }> }

function validationError(errors: Record<string, string>, status = 400) {
  return Response.json({ errors } satisfies ValidationErrorBody, { status })
}

const ROOM_NOT_FOUND = { message: 'Room not found.' }

/** US-14 AT-1 / AT-4: the room's saved layouts by name. 200 with an array (possibly empty), 400 for a malformed id, 404 if the room does not exist, 500 if the database fails. */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  const roomId = roomIdSchema.safeParse(id)
  if (!roomId.success) {
    return validationError({ id: roomId.error.issues[0].message })
  }

  try {
    if (!(await roomExists(roomId.data))) {
      return Response.json(ROOM_NOT_FOUND, { status: 404 })
    }
    return Response.json(await findLayouts(roomId.data))
  } catch (error) {
    console.error('Failed to list layouts', error)
    return Response.json(
      { message: 'Could not load the saved layouts. Please try again later.' },
      { status: 500 },
    )
  }
}

/**
 * US-13: saves a named layout with its placed items.
 * 201 with the layout, 400 with field errors, 404 if the room does not exist,
 * 409 if the room already has a layout with this name (AT-6), 500 if the database fails (AT-5).
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const roomId = roomIdSchema.safeParse(id)
  if (!roomId.success) {
    return validationError({ id: roomId.error.issues[0].message })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: 'must be valid JSON' })
  }

  const parsed = createLayoutSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(toFieldErrors(parsed.error))
  }

  try {
    if (!(await roomExists(roomId.data))) {
      return Response.json(ROOM_NOT_FOUND, { status: 404 })
    }

    // An unknown catalog item is the client's mistake (400), not a database failure (500).
    const prices = await findItemPrices(parsed.data.items.map((item) => item.catalogItemId))
    const missing = parsed.data.items.find((item) => !prices.has(item.catalogItemId))
    if (missing) {
      return validationError({ items: `catalog item ${missing.catalogItemId} does not exist` })
    }

    const layout = await createLayout(roomId.data, parsed.data, prices)
    return Response.json(layout, { status: 201 })
  } catch (error) {
    // AT-6: the unique (room, name) index rejected the insert; the existing layout is untouched.
    if (isUniqueViolation(error)) {
      return validationError({ name: DUPLICATE_LAYOUT_NAME }, 409)
    }
    // Log the details on the server only; the client gets a generic message.
    console.error('Failed to save layout', error)
    return Response.json(
      { message: 'Could not save the layout. Please try again later.' },
      { status: 500 },
    )
  }
}
