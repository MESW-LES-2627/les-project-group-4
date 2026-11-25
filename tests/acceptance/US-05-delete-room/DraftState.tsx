import { useEffect, type ReactNode } from 'react'

import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'
import type { PlacedItem } from '@/features/plan/model/layout'
import type { CurrentRoom } from '@/features/plan/types'

/** Puts items in rooms' unsaved plans and sets the catalog's target room, as using the app does. */
export function SeedDraft({
  drafts,
  currentRoom,
  children,
}: {
  drafts: Record<number, PlacedItem[]>
  currentRoom: CurrentRoom | null
  children: ReactNode
}) {
  const { replaceItems, setCurrentRoom } = useDraftLayouts()
  useEffect(() => {
    for (const [roomId, items] of Object.entries(drafts)) replaceItems(Number(roomId), items)
    setCurrentRoom(currentRoom)
  }, [drafts, currentRoom, replaceItems, setCurrentRoom])
  return children
}

/** Shows the session draft state the tests check: the catalog's target room and item counts. */
export function DraftProbe({ roomIds }: { roomIds: number[] }) {
  const { currentRoom, itemsFor } = useDraftLayouts()
  return (
    <output data-testid="draft-probe">
      {`current:${currentRoom?.id ?? 'none'}`}
      {roomIds.map((id) => ` room${id}:${itemsFor(id).length}`).join('')}
    </output>
  )
}
