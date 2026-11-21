import type { ValidationErrorBody } from '@/lib/http'
import { findRoomById } from '@/lib/rooms'
import { roomIdSchema } from '@/features/rooms/schema'

/** US-03: one room. 200 with the room, 400 for a malformed id, 404 if it does not exist, 500 if the database fails. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsed = roomIdSchema.safeParse(id)
  if (!parsed.success) {
    return Response.json(
      { errors: { id: parsed.error.issues[0].message } } satisfies ValidationErrorBody,
      { status: 400 },
    )
  }

  try {
    const room = await findRoomById(parsed.data)
    if (room === null) {
      return Response.json({ message: 'Room not found.' }, { status: 404 })
    }
    return Response.json(room)
  } catch (error) {
    // Log the details on the server only; the client gets a generic message.
    console.error('Failed to load room', error)
    return Response.json(
      { message: 'Could not load the room. Please try again later.' },
      { status: 500 },
    )
  }
}
