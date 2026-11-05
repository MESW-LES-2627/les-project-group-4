import type { ValidationErrorBody } from '@/api/types'
import { findItems } from '@/lib/items'
import { listItemsQuerySchema } from '@/lib/schemas/item'
import { toFieldErrors } from '@/lib/schemas/room'

/**
 * US-07: lists catalog items, optionally filtered by ?category=<slug>.
 * 200 with an array (possibly empty), 400 for an unknown category, 500 if the database fails.
 */
export async function GET(request: Request) {
  // getAll, not get: ?category=sofa&category=bed must be rejected, as on the /catalog page,
  // instead of silently using the first value.
  const values = new URL(request.url).searchParams.getAll('category')
  const category = values.length > 1 ? values : values[0]

  const parsed = listItemsQuerySchema.safeParse({ category })
  if (!parsed.success) {
    return Response.json({ errors: toFieldErrors(parsed.error) } satisfies ValidationErrorBody, {
      status: 400,
    })
  }

  try {
    const items = await findItems(parsed.data.category)
    return Response.json(items)
  } catch (error) {
    console.error('Failed to list items', error)
    return Response.json(
      { message: 'Could not load the catalog. Please try again later.' },
      { status: 500 },
    )
  }
}