'use client'

import { useCallback, useMemo, useReducer, useState, type ReactNode } from 'react'

import {
  DraftLayoutsContext,
  type CurrentRoom,
  type DraftLayouts,
} from '@/hooks/useDraftLayouts'
import type { Placement, RoomSize } from '@/lib/geometry/plan'
import { draftReducer, EMPTY_DRAFT_STATE } from '@/lib/layout/draft'
import type { PlacedItem, PlacedItemSource } from '@/lib/layout/layout'

/** One shared empty array, so a room with no items keeps a stable prop. */
const NO_ITEMS: PlacedItem[] = []

/**
 * US-09: keeps every room's unsaved layout for the whole session. It sits above
 * the routes in the root layout, so visiting the catalog and coming back keeps
 * the items (AT-6).
 */
export function DraftLayoutsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(draftReducer, EMPTY_DRAFT_STATE)
  const [currentRoom, setCurrentRoom] = useState<CurrentRoom | null>(null)

  const itemsFor = useCallback(
    (roomId: number) => state.byRoom[roomId] ?? NO_ITEMS,
    [state.byRoom],
  )

  const errorFor = useCallback(
    (roomId: number) => (state.error?.roomId === roomId ? state.error.message : null),
    [state.error],
  )

  const addItem = useCallback((roomId: number, room: RoomSize, item: PlacedItemSource) => {
    dispatch({ type: 'add', roomId, room, id: crypto.randomUUID(), item })
  }, [])

  const addItemAt = useCallback(
    (roomId: number, room: RoomSize, item: PlacedItemSource, placement: Placement) => {
      dispatch({ type: 'add-at', roomId, room, id: crypto.randomUUID(), item, placement })
    },
    [],
  )

  const removeItem = useCallback((roomId: number, id: string) => {
    dispatch({ type: 'remove', roomId, id })
  }, [])

  const replaceItems = useCallback((roomId: number, items: PlacedItem[]) => {
    dispatch({ type: 'replace', roomId, items })
  }, [])

  const dismissError = useCallback((roomId: number) => {
    dispatch({ type: 'dismiss-error', roomId })
  }, [])

  const value = useMemo<DraftLayouts>(
    () => ({
      currentRoom,
      setCurrentRoom,
      itemsFor,
      errorFor,
      addItem,
      addItemAt,
      removeItem,
      replaceItems,
      dismissError,
    }),
    [currentRoom, itemsFor, errorFor, addItem, addItemAt, removeItem, replaceItems, dismissError],
  )

  return <DraftLayoutsContext.Provider value={value}>{children}</DraftLayoutsContext.Provider>
}
