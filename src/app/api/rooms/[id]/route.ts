import { ROOM_NOT_FOUND, serverError, validationError } from '@/app/api/response'
import { roomIdSchema, updateRoomSchema } from '@/features/rooms/schema'
import { deleteRoom, findRoomById, updateRoom } from '@/features/rooms/server/rooms'
import { toFieldErrors } from '@/lib/validation'

/** US-03: one room. 200 with the room, 400 for a malformed id, 404 if it does not exist, 500 if the database fails. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsed = roomIdSchema.safeParse(id)
  if (!parsed.success) {
    return validationError({ id: parsed.error.issues[0].message })
  }

  try {
    const room = await findRoomById(parsed.data)
    if (room === null) {
      return Response.json(ROOM_NOT_FOUND, { status: 404 })
    }
    return Response.json(room)
  } catch (error) {
    return serverError(
      'Failed to load room',
      'Could not load the room. Please try again later.',
      error,
    )
  }
}

/**
 * US-04: edits a room's name and dimensions, with the same validation as create.
 * 200 with the updated room, 400 for a malformed id or invalid body, 404 if it does not exist,
 * 500 if the database fails.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsedId = roomIdSchema.safeParse(id)
  if (!parsedId.success) {
    return validationError({ id: parsedId.error.issues[0].message })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: 'must be valid JSON' })
  }

  const parsed = updateRoomSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(toFieldErrors(parsed.error))
  }

  try {
    const room = await updateRoom(parsedId.data, parsed.data)
    if (room === null) {
      return Response.json(ROOM_NOT_FOUND, { status: 404 })
    }
    return Response.json(room)
  } catch (error) {
    return serverError(
      'Failed to update room',
      'Could not save the room. Please try again later.',
      error,
    )
  }
}

/**
 * US-05: deletes a room, with its saved layouts and their items (ON DELETE CASCADE).
 * 204 with no body, 400 for a malformed id, 404 if it does not exist, 500 if the database fails.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsed = roomIdSchema.safeParse(id)
  if (!parsed.success) {
    return validationError({ id: parsed.error.issues[0].message })
  }

  try {
    if (!(await deleteRoom(parsed.data))) {
      return Response.json(ROOM_NOT_FOUND, { status: 404 })
    }
    return new Response(null, { status: 204 })
  } catch (error) {
    return serverError(
      'Failed to delete room',
      'Could not delete the room. Please try again later.',
      error,
    )
  }
}
