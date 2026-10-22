import type { Room, ValidationErrorBody } from '@/api/types'
import { db } from '@/lib/db'
import { createRoomSchema, toFieldErrors } from '@/lib/schemas/room'

function validationError(errors: Record<string, string>) {
  return Response.json({ errors } satisfies ValidationErrorBody, { status: 400 })
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
    const room: Room = await db.room.create({
      data: parsed.data,
      select: { id: true, name: true, widthCm: true, lengthCm: true },
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
