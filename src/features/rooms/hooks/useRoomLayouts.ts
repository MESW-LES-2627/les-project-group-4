import { useCallback, useMemo, useState } from 'react'

import { visibleLayouts } from '../model/savedLayouts'
import type { LayoutWithItems } from '../types'

/**
 * US-14b AT-5 / US-05: the room's saved layouts as the page shows them. A layout deleted on
 * this page leaves the list at once, before `router.refresh()` brings the new server list,
 * so every part of the page (the list, the save form, the delete-room warning) counts the
 * same layouts.
 */
export function useRoomLayouts(layouts: readonly LayoutWithItems[]) {
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<number>>(new Set())

  const visible = useMemo(() => visibleLayouts(layouts, deletedIds), [layouts, deletedIds])

  const markDeleted = useCallback((id: number) => {
    setDeletedIds((ids) => new Set(ids).add(id))
  }, [])

  return { visible, markDeleted }
}
