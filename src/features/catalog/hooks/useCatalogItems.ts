import { useEffect, useRef, useState } from 'react'

import { listItems } from '@/features/catalog/api'
import { createLatestRequest, runLatest } from '@/features/catalog/model/latestRequest'
import type { ListItemsQuery } from '@/features/catalog/schema'
import type { CatalogItem } from '@/features/catalog/types'

/**
 * US-08: the catalog list for the current filters. Starts from the items the server rendered
 * and reloads from GET /api/items on every filter change; only the latest response is applied
 * (AT-7), so two quick changes can never leave the older results on screen.
 */
export function useCatalogItems(initialItems: CatalogItem[]) {
  const [items, setItems] = useState(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requests = useRef(createLatestRequest())

  // Leaving the page aborts the request in flight; its response is then ignored.
  useEffect(() => {
    const current = requests.current
    return () => current.cancel()
  }, [])

  async function load(query: ListItemsQuery) {
    setIsLoading(true)
    setError(null)

    await runLatest(
      requests.current,
      (signal) => listItems(query, signal),
      (result) => {
        setIsLoading(false)
        if (result.ok) {
          setItems(result.data)
        } else {
          setError(result.error.message)
        }
      },
    )
  }

  return { items, isLoading, error, load }
}
