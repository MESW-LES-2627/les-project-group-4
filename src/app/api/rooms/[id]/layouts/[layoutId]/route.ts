import type { ValidationErrorBody } from '@/api/types'
import { deleteLayout, findLayout } from '@/lib/layouts'
import { layoutIdSchema } from '@/lib/schemas/layout'
import { roomIdSchema } from '@/lib/schemas/room'

type Context = { params: Promise<{ id: string; layoutId: string }> }

const LAYOUT_NOT_FOUND = { message: 'Layout not found.' }

/** Parses both ids from the URL, or returns the 400 response for the first malformed one. */
async function parseIds(
  params: Context['params'],
): Promise<{ roomId: number; layoutId: number } | Response> {
  const { id, layoutId } = await params
  const room = roomIdSchema.safeParse(id)
  if (!room.success) {
    return Response.json(
      { errors: { id: room.error.issues[0].message } } satisfies ValidationErrorBody,
      { status: 400 },
    )
  }
  const layout = layoutIdSchema.safeParse(layoutId)
  if (!layout.success) {
    return Response.json(
      { errors: { layoutId: layout.error.issues[0].message } } satisfies ValidationErrorBody,
      { status: 400 },
    )
  }
  return { roomId: room.data, layoutId: layout.data }
}

/**
 * US-14 AT-2 / AT-5: one saved layout with its items.
 * 200 with the layout, 400 for a malformed id, 404 if it does not exist in this room, 500 if the database fails.
 */
export async function GET(_request: Request, { params }: Context) {
  const ids = await parseIds(params)
  if (ids instanceof Response) return ids

  try {
    const layout = await findLayout(ids.roomId, ids.layoutId)
    if (layout === null) {
      return Response.json(LAYOUT_NOT_FOUND, { status: 404 })
    }
    return Response.json(layout)
  } catch (error) {
    console.error('Failed to load layout', error)
    return Response.json(
      { message: 'Could not load the layout. Please try again later.' },
      { status: 500 },
    )
  }
}

/**
 * US-14 AT-6: deletes a saved layout and its items.
 * 204 with no body, 400 for a malformed id, 404 if it does not exist in this room, 500 if the database fails.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const ids = await parseIds(params)
  if (ids instanceof Response) return ids

  try {
    if (!(await deleteLayout(ids.roomId, ids.layoutId))) {
      return Response.json(LAYOUT_NOT_FOUND, { status: 404 })
    }
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete layout', error)
    return Response.json(
      { message: 'Could not delete the layout. Please try again later.' },
      { status: 500 },
    )
  }
}
