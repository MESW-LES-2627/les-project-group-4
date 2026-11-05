import { z } from 'zod'

import { ITEM_CATEGORIES } from '@/lib/catalog'
import type { ItemCategory } from '@/lib/catalog'

/**
 * A catalog category, validated the same way as rooms: routes safeParse their input
 * and turn errors into { field: message } with toFieldErrors.
 */
export const itemCategorySchema = z.enum(ITEM_CATEGORIES, {
  error: `must be one of: ${ITEM_CATEGORIES.join(', ')}`,
})

/** True when `value` is one of the known categories. Thin wrapper over itemCategorySchema. */
export function isItemCategory(value: unknown): value is ItemCategory {
  return itemCategorySchema.safeParse(value).success
}

/**
 * US-07: the query of GET /api/items and the /catalog page. No category means all items.
 * Shared by the route and the page so both accept exactly the same input.
 */
export const listItemsQuerySchema = z.object({
  category: itemCategorySchema.optional(),
})

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>