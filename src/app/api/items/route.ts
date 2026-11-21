import { serverError, validationError } from '@/app/api/response'
import { findItems } from '@/features/catalog/server/items'
import { listItemsQuerySchema, readListItemsQuery } from '@/features/catalog/schema'
import { toFieldErrors } from '@/lib/validation'

/**
 * US-07/US-08: lists catalog items, filtered by ?category=, ?maxPrice= (euros),
 * ?style= and ?room= (repeatable). 200 with an array (possibly empty), 400 for an invalid
 * filter, 500 if the database fails.
 */
export async function GET(request: Request) {
  const parsed = listItemsQuerySchema.safeParse(
    readListItemsQuery(new URL(request.url).searchParams),
  )
  if (!parsed.success) {
    return validationError(toFieldErrors(parsed.error))
  }

  try {
    const items = await findItems(parsed.data)
    return Response.json(items)
  } catch (error) {
    return serverError(
      'Failed to list items',
      'Could not load the catalog. Please try again later.',
      error,
    )
  }
}
