import { z } from 'zod'

import { ITEM_CATEGORIES } from '@/features/catalog/model/catalog'
import type { ItemCategory } from '@/features/catalog/model/catalog'
import { MAX_INT } from '@/lib/validation'

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
 * US-08: a maximum price in euros as typed in the URL ("500", "499.99"), turned into cents.
 * A string regex instead of z.coerce.number(): coerce turns "" into 0 and accepts "1e3".
 */
const maxPriceSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { error: 'must be a price in euros, e.g. 500 or 499.99' })
  .transform((euros) => Math.round(Number(euros) * 100))
  .pipe(z.number().int().max(MAX_INT, { error: 'is too large' }))

/** US-08: a style or room-type tag as stored by the seed (nordic, living-room). */
export const itemTagSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: 'must be lower-case tags such as nordic or living-room' })

/** US-07/US-08: a parsed catalog query. A missing field means "no filter". */
export interface ListItemsQuery {
  category?: ItemCategory
  maxPriceCents?: number
  style?: string[]
  room?: string[]
}

/**
 * US-07/US-08: the query of GET /api/items and the /catalog page. A missing field means
 * "no filter". Shared by the route and the page so both accept exactly the same input.
 * `maxPrice` arrives in euros and leaves as `maxPriceCents`, the unit of Item.priceCents.
 */
export const listItemsQuerySchema = z
  .object({
    category: itemCategorySchema.optional(),
    maxPrice: maxPriceSchema.optional(),
    style: z.array(itemTagSchema).optional(),
    room: z.array(itemTagSchema).optional(),
  })
  .transform(({ maxPrice, style, room, ...rest }): ListItemsQuery => ({
    ...rest,
    maxPriceCents: maxPrice,
    // An empty list is "no filter", same as a missing one.
    style: style?.length ? style : undefined,
    room: room?.length ? room : undefined,
  }))

/**
 * Reads the raw query for listItemsQuerySchema from URL search params.
 * category and maxPrice take one value: a repeated one (?category=sofa&category=bed) is passed
 * as an array so the schema rejects it instead of silently using the first value.
 */
export function readListItemsQuery(params: URLSearchParams) {
  const single = (key: string) => {
    const values = params.getAll(key)
    return values.length > 1 ? values : values[0]
  }
  return {
    category: single('category'),
    maxPrice: single('maxPrice'),
    style: params.getAll('style'),
    room: params.getAll('room'),
  }
}
