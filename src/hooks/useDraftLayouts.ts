'use client'

import { createContext, useContext } from 'react'

import type { Room } from '@/api/types'
import type { Placement, RoomSize } from '@/lib/geometry/plan'
import type { PlacedItem, PlacedItemSource } from '@/lib/layout/layout'

/** The last room opened in this session: where the catalog adds items. */
export type CurrentRoom = Pick<Room, 'id' | 'name' | 'widthCm' | 'lengthCm'>

/** US-09: the draft layout of every room, shared by the plan and the catalog. */
export interface DraftLayouts {
  currentRoom: CurrentRoom | null
  setCurrentRoom: (room: CurrentRoom | null) => void
  itemsFor: (roomId: number) => PlacedItem[]
  errorFor: (roomId: number) => string | null
  addItem: (roomId: number, room: RoomSize, item: PlacedItemSource) => void
  addItemAt: (roomId: number, room: RoomSize, item: PlacedItemSource, placement: Placement) => void
  removeItem: (roomId: number, id: string) => void
  replaceItems: (roomId: number, items: PlacedItem[]) => void
  dismissError: (roomId: number) => void
}

export const DraftLayoutsContext = createContext<DraftLayouts | null>(null)

export function useDraftLayouts(): DraftLayouts {
  const drafts = useContext(DraftLayoutsContext)
  if (drafts === null) {
    throw new Error('useDraftLayouts must be used inside DraftLayoutsProvider')
  }
  return drafts
}
