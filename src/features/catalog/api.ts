import { toQueryString } from '@/features/catalog/model/catalogFilters'
import type { ListItemsQuery } from '@/features/catalog/schema'
import type { CatalogItem } from '@/features/catalog/types'
import { request, type ApiResult } from '@/lib/http'

/**
 * US-08: lists catalog items for a filter query. `signal` lets the caller abort a request
 * that a newer filter change has replaced (an aborted request resolves as a network error,
 * which the caller ignores because it is no longer the latest).
 */
export function listItems(
  query: ListItemsQuery,
  signal?: AbortSignal,
): Promise<ApiResult<CatalogItem[]>> {
  return request<CatalogItem[]>(`/api/items${toQueryString(query)}`, { method: 'GET', signal })
}
