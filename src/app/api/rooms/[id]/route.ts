import { ROOM_NOT_FOUND, serverError, validationError } from '@/app/api/response'
import { roomIdSchema } from '@/features/rooms/schema'
import { findRoomById } from '@/features/rooms/server/rooms'

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
