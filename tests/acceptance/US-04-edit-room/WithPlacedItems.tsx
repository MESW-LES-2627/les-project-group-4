import { useEffect, type ReactNode } from 'react'

import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'
import type { PlacedItem } from '@/features/plan/model/layout'

/** Puts items in a room's unsaved plan, the way "Add to plan" does (US-04 AT-4 tests). */
export function WithPlacedItems({
  roomId,
  items,
  children,
}: {
  roomId: number
  items: PlacedItem[]
  children: ReactNode
}) {
  const { replaceItems } = useDraftLayouts()
  useEffect(() => {
    replaceItems(roomId, items)
  }, [roomId, items, replaceItems])
  return children
}
