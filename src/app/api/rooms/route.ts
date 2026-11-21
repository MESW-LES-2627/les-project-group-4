import type { Room } from '@/features/rooms/types'
import type { ValidationErrorBody } from '@/lib/http'
import { cityExists } from '@/features/locations/server/cities'
import { getDb } from '@/lib/db'
import { findRooms, ROOM_SELECT } from '@/lib/rooms'
import { createRoomSchema } from '@/features/rooms/schema'
import { toFieldErrors } from '@/lib/validation'

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

/** US-01, US-15: creates a room, optionally with a location. 201 with the room, 400 with field errors, 500 if the database fails. */
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
    // US-15: an unknown city is the client's mistake (400), not a database failure (500).
    if (parsed.data.cityId !== undefined && !(await cityExists(parsed.data.cityId))) {
      return validationError({ cityId: 'does not exist' })
    }

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
