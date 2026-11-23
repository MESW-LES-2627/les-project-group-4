import { serverError, validationError } from '@/app/api/response'
import { cityExists } from '@/features/locations/server/cities'
import { createRoomSchema } from '@/features/rooms/schema'
import { createRoom, findRooms } from '@/features/rooms/server/rooms'
import { toFieldErrors } from '@/lib/validation'

/** US-02: lists every room, newest first. 200 with an array (possibly empty), 500 if the database fails. */
export async function GET() {
  try {
    const rooms = await findRooms()
    return Response.json(rooms)
  } catch (error) {
    return serverError(
      'Failed to list rooms',
      'Could not load the rooms. Please try again later.',
      error,
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

    const room = await createRoom(parsed.data)
    return Response.json(room, { status: 201 })
  } catch (error) {
    return serverError(
      'Failed to create room',
      'Could not create the room. Please try again later.',
      error,
    )
  }
}
