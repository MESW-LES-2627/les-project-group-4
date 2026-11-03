import type { Room, ValidationErrorBody } from '@/api/types'
import { getDb } from '@/lib/db'
import { findRooms, ROOM_SELECT } from '@/lib/rooms'
import { createRoomSchema, toFieldErrors } from '@/lib/schemas/room'

function validationError(errors: Record<string, string>) {
  return Response.json({ errors } satisfies ValidationErrorBody, { status: 400 })
}

/** US-02: lists every room, newest first. 200 with an array (possibly empty), 500 if the database fails. */
export async function GET() {
  try {
    const rooms = await findRooms()
    return Response.json(rooms)
  } catch (error) {
    console.error('Failed to list rooms', error)
    return Response.json(
      { message: 'Could not load the rooms. Please try again later.' },
      { status: 500 },
    )
  }
}

/** US-01: creates a room. 201 with the room, 400 with field errors, 500 if the database fails. */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: 'must be valid JSON' })
  }

  const parsed = createRoomSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(toFieldErrors(parsed.error))
  }

  try {
    const room: Room = await getDb().room.create({
      data: parsed.data,
      select: ROOM_SELECT,
    })
    return Response.json(room, { status: 201 })
  } catch (error) {
    // Log the details on the server only; the client gets a generic message.
    console.error('Failed to create room', error)
    return Response.json(
      { message: 'Could not create the room. Please try again later.' },
      { status: 500 },
    )
  }
}
