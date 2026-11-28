import { ROOM_NOT_FOUND, serverError, validationError } from '@/app/api/response'
import { roomIdSchema } from '@/features/rooms/schema'
import { deleteRoom, findRoomById } from '@/features/rooms/server/rooms'

type Context = { params: Promise<{ id: string }> }

/** The room id from the URL, or the 400 response for a malformed one. */
async function parseRoomId(params: Context['params']): Promise<number | Response> {
  const { id } = await params
  const parsed = roomIdSchema.safeParse(id)
  if (!parsed.success) {
    return validationError({ id: parsed.error.issues[0].message })
  }
  return parsed.data
}

/** US-03: one room. 200 with the room, 400 for a malformed id, 404 if it does not exist, 500 if the database fails. */
export async function GET(_request: Request, { params }: Context) {
  const id = await parseRoomId(params)
  if (id instanceof Response) return id

  try {
    const room = await findRoomById(id)
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
 * US-05: deletes a room, with its saved layouts and their items (ON DELETE CASCADE).
 * 204 with no body, 400 for a malformed id, 404 if it does not exist, 500 if the database fails.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const id = await parseRoomId(params)
  if (id instanceof Response) return id

  try {
    if (!(await deleteRoom(id))) {
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
