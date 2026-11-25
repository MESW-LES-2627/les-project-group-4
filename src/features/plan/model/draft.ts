/**
 * US-09 — the unsaved layout of every room, kept for the session.
 *
 * One reducer holds all rooms' drafts so switching rooms or visiting the
 * catalog does not lose work (AT-6), and keeps the last failed placement next
 * to it so the UI can show AT-5's message. Pure: the provider in
 * src/components/layout/DraftLayoutProvider.tsx owns the React state.
 */

import { boundingBox, isInsideRoom, type Placement, type RoomSize } from '@/features/plan/model/geometry'
import { toPlacedItem } from '@/features/plan/model/layout'
import type { PlacedItem } from '@/features/plan/model/layout'
import type { PlacedItemSource } from '@/features/plan/types'
import {
  DOES_NOT_FIT_MESSAGE,
  PLACEMENT_MARGIN_CM,
  overlaps,
  placeInRoom,
} from '@/features/plan/model/placement'

/** A failed placement, scoped to the room it happened in. */
export interface DraftError {
  roomId: number
  message: string
}

export interface DraftState {
  /** Unsaved items per room id; a room with nothing added has no entry. */
  byRoom: Partial<Record<number, PlacedItem[]>>
  /** AT-5: the last placement failure. */
  error: DraftError | null
}

export const EMPTY_DRAFT_STATE: DraftState = { byRoom: {}, error: null }

export type DraftAction =
  | { type: 'add'; roomId: number; room: RoomSize; id: string; item: PlacedItemSource }
  | { type: 'add-at'; roomId: number; room: RoomSize; id: string; item: PlacedItemSource; placement: Placement }
  | { type: 'remove'; roomId: number; id: string }
  | { type: 'replace'; roomId: number; items: PlacedItem[] }
  | { type: 'dismiss-error'; roomId: number }
  /** US-05: the room was deleted, so its draft and its error go too. */
  | { type: 'forget'; roomId: number }

/** Drops the error only when it belongs to this room; another room's stays. */
function withoutError(state: DraftState, roomId: number): DraftState['error'] {
  return state.error?.roomId === roomId ? null : state.error
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'add': {
      const items = state.byRoom[action.roomId] ?? []
      const placement = placeInRoom(action.item, action.room, items)
      if (placement === null) {
        return {
          ...state,
          error: { roomId: action.roomId, message: DOES_NOT_FIT_MESSAGE },
        }
      }

      return {
        byRoom: {
          ...state.byRoom,
          [action.roomId]: [...items, toPlacedItem(action.item, action.id, placement)],
        },
        error: withoutError(state, action.roomId),
      }
    }
    case 'add-at': {
      const items = state.byRoom[action.roomId] ?? []
      const existingBoxes = items.map((item) => boundingBox(item, item))

      const requestedBox = boundingBox(action.item, action.placement)
      const fitsRequested =
        isInsideRoom(action.item, action.placement, action.room, PLACEMENT_MARGIN_CM) &&
        !existingBoxes.some((other) => overlaps(requestedBox, other))

      const placement = fitsRequested
        ? action.placement
        : placeInRoom(action.item, action.room, items)

      if (placement === null) {
        return {
          ...state,
          error: { roomId: action.roomId, message: DOES_NOT_FIT_MESSAGE },
        }
      }

      return {
        byRoom: {
          ...state.byRoom,
          [action.roomId]: [...items, toPlacedItem(action.item, action.id, placement)],
        },
        error: withoutError(state, action.roomId),
      }
    }
    case 'remove': {
      const items = state.byRoom[action.roomId]
      if (items === undefined) return state

      return {
        ...state,
        byRoom: {
          ...state.byRoom,
          [action.roomId]: items.filter((item) => item.id !== action.id),
        },
        error: withoutError(state, action.roomId),
      }
    }
    case 'replace':
      return {
        ...state,
        byRoom: { ...state.byRoom, [action.roomId]: action.items },
        error: withoutError(state, action.roomId),
      }
    case 'forget': {
      if (state.byRoom[action.roomId] === undefined && state.error?.roomId !== action.roomId) {
        return state
      }
      const { [action.roomId]: _forgotten, ...byRoom } = state.byRoom
      return { byRoom, error: withoutError(state, action.roomId) }
    }
    case 'dismiss-error':
      return state.error?.roomId === action.roomId ? { ...state, error: null } : state
    default: {
      const unreachable: never = action
      throw new Error(`Unhandled draft action: ${JSON.stringify(unreachable)}`)
    }
  }
}
