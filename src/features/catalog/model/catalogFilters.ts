// US-08: catalog filter helpers shared by the page, the filter UI and the API client.
// Pure functions (no React, no fetch), so the acceptance tests can call them directly.

import { listItemsQuerySchema } from '@/features/catalog/schema'
import type { ListItemsQuery } from '@/features/catalog/schema'

/**
 * The query string for a catalog query, in the same format readListItemsQuery reads:
 * "" for no filter, otherwise "?category=sofa&maxPrice=500&style=nordic&style=modern&room=bedroom".
 * maxPrice goes back to euros because that is what a person types and reads in the URL.
 */
export function toQueryString(query: ListItemsQuery): string {
  const params = new URLSearchParams()
  if (query.category !== undefined) params.set('category', query.category)
  if (query.maxPriceCents !== undefined) params.set('maxPrice', String(query.maxPriceCents / 100))
  for (const tag of query.style ?? []) params.append('style', tag)
  for (const tag of query.room ?? []) params.append('room', tag)
  const text = params.toString()
  return text === '' ? '' : `?${text}`
}

/** The catalog URL for a query on `basePath`; clearing every filter gives the bare path (AT-6). */
export function catalogHref(query: ListItemsQuery, basePath = '/catalog'): string {
  return `${basePath}${toQueryString(query)}`
}

/**
 * US-08: reads the maximum price typed in the filter form. Accepts "500", "499.99" and the
 * pt-PT "499,99" (prices are shown with a comma). Returns cents, undefined for an empty field
 * (no price filter), or null when the text is not a valid price. Uses the API's own schema,
 * so the form and the server agree on what a valid price is.
 */
export function parsePriceInput(text: string): number | undefined | null {
  const euros = text.trim().replace(',', '.')
  if (euros === '') return undefined
  const parsed = listItemsQuerySchema.safeParse({ maxPrice: euros })
  return parsed.success ? (parsed.data.maxPriceCents ?? null) : null
}

/** True when any filter is set, so the UI can offer "Clear filters". */
export function hasFilters(query: ListItemsQuery): boolean {
  return toQueryString(query) !== ''
}

/** Adds the tag when it is not selected, removes it when it is. Undefined when none remain. */
export function toggleTag(tags: string[] | undefined, tag: string): string[] | undefined {
  const current = tags ?? []
  const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
  return next.length === 0 ? undefined : next
}

/** "living-room" -> "Living room": tags are stored as slugs, shown as words. */
export function tagLabel(tag: string): string {
  const words = tag.replaceAll('-', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
