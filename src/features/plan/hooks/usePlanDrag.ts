'use client'

import { useCallback, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

import type { Placement, Point, RoomSize } from '@/features/plan/model/geometry'
import type { PlacedItem as PlacedItemData } from '@/features/plan/model/layout'
import { dragPlacement } from '@/features/plan/model/manipulation'

/**
 * How far (in screen pixels) the pointer may wander before a click becomes a
 * drag. Matches the click tolerance `PlacedItem` uses, so a shaky hand still
 * selects or rotates instead of nudging the item.
 */
export const DRAG_TOLERANCE_PX = 4

/** One pointer-down-to-up interaction with an item. */
export interface DragSession {
  id: string
  pointerId: number
  /** Where the pointer grabbed the item, relative to its centre, in cm. */
  grabOffsetCm: Point
  startPlacement: Placement
  preview: Placement
  /** The pointer travelled past DRAG_TOLERANCE_PX, so this is a drag. */
  moved: boolean
  /** The item was selected at pointerdown, so a click without movement rotates it. */
  wasSelected: boolean
  /** Screen position at pointerdown, for the click/drag tolerance. */
  startClientPx: Point
}

export type PlanItemPointerHandler = (
  item: PlacedItemData,
  event: ThreeEvent<PointerEvent>,
) => void

export interface UsePlanDragOptions {
  room: RoomSize
  items?: PlacedItemData[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onMoveItem?: (id: string, placement: Placement) => void
  /** US-10: rotate the selected item when it is clicked again without moving. */
  onRotateItem?: (id: string) => void
  /** Keeps the camera still while an item is dragged (controls disabled). */
  onDraggingChange?: (dragging: boolean) => void
  /** The pointer ray's intersection with the floor, in room centimetres. */
  roomPoint: (event: ThreeEvent<PointerEvent>) => Point | null
  capturePointer?: (event: ThreeEvent<PointerEvent>) => void
  releasePointer?: (event: ThreeEvent<PointerEvent>) => void
}

export interface PlanDrag {
  /** The items with the live drag preview applied, ready to render. */
  displayItems: PlacedItemData[]
  /** The active session, or null when nothing is being dragged. */
  drag: DragSession | null
  /** The pointer captured by the active session, for the window-up fallback. */
  pointerId: number | null
  handleItemPointerDown: PlanItemPointerHandler
  handleItemPointerMove: PlanItemPointerHandler
  handleItemPointerUp: PlanItemPointerHandler
  handleItemPointerCancel: PlanItemPointerHandler
  /** Clears the selection when the plan itself is clicked, unless a drop just happened. */
  handlePointerMissed: () => void
  /** Re-arms selection clearing on a fresh pointerdown. */
  resetPointerMissed: () => void
  /** Ends the active session, committing the preview when `commit` is true. */
  finishDrag: (commit: boolean) => void
}

/** Ends a session only when it belongs to the item and pointer of the event. */
function ownsSession(
  session: DragSession | null,
  item: PlacedItemData,
  event: ThreeEvent<PointerEvent>,
): session is DragSession {
  return (
    session !== null &&
    session.pointerId === event.pointerId &&
    session.id === item.id
  )
}

function screenDistancePx(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

/**
 * US-10: the pointer interaction on the 2D plan, extracted from Plan2D so it
 * can be tested without a canvas.
 *
 * A pointer-down selects the item and starts a transient drag; moving past
 * DRAG_TOLERANCE_PX turns it into a drag that commits on release. Releasing
 * without moving keeps the selection, or rotates an already selected item.
 * Positions stay in room centimetres — only the click/drag decision uses
 * screen pixels.
 */
export function usePlanDrag({
  room,
  items = [],
  selectedId = null,
  onSelect,
  onMoveItem,
  onRotateItem,
  onDraggingChange,
  roomPoint,
  capturePointer,
  releasePointer,
}: UsePlanDragOptions): PlanDrag {
  const [drag, setDrag] = useState<DragSession | null>(null)
  // The window pointerup fallback and the next event need the latest session
  // synchronously, before React has re-rendered.
  const dragRef = useRef<DragSession | null>(null)
  const suppressMissedRef = useRef(false)

  const setSession = useCallback((next: DragSession | null) => {
    dragRef.current = next
    setDrag(next)
  }, [])

  const finishDrag = useCallback(
    (commit: boolean) => {
      const session = dragRef.current
      if (session === null) return

      setSession(null)
      onDraggingChange?.(false)

      if (!commit) return

      // A drag is a transient selection: the item is highlighted while it
      // moves, then the plan is left with nothing selected. A click without
      // movement either selects the item or, if it was already selected,
      // rotates it in place (US-10).
      if (!session.moved) {
        if (session.wasSelected) {
          onRotateItem?.(session.id)
        } else {
          onSelect?.(session.id)
        }
        return
      }

      suppressMissedRef.current = true
      onSelect?.(null)
      onMoveItem?.(session.id, session.preview)
    },
    [onDraggingChange, onMoveItem, onRotateItem, onSelect, setSession],
  )

  const handleItemPointerDown: PlanItemPointerHandler = useCallback(
    (item, event) => {
      if (!onMoveItem || dragRef.current !== null || event.button !== 0) return

      const point = roomPoint(event)
      if (point === null) return

      event.stopPropagation()
      onDraggingChange?.(true)
      capturePointer?.(event)
      onSelect?.(item.id)

      const startPlacement: Placement = {
        xCm: item.xCm,
        yCm: item.yCm,
        rotationDeg: item.rotationDeg,
      }
      const session: DragSession = {
        id: item.id,
        pointerId: event.pointerId,
        grabOffsetCm: { x: item.xCm - point.x, y: item.yCm - point.y },
        startPlacement,
        preview: startPlacement,
        moved: false,
        wasSelected: selectedId === item.id,
        startClientPx: { x: event.clientX, y: event.clientY },
      }
      setSession(session)
    },
    [
      capturePointer,
      onDraggingChange,
      onMoveItem,
      onSelect,
      roomPoint,
      selectedId,
      setSession,
    ],
  )

  const handleItemPointerMove: PlanItemPointerHandler = useCallback(
    (item, event) => {
      const session = dragRef.current
      if (!ownsSession(session, item, event)) return

      const point = roomPoint(event)
      if (point === null) return

      event.stopPropagation()
      const preview = dragPlacement(
        item,
        session.startPlacement,
        point,
        session.grabOffsetCm,
        room,
        0,
      )
      const moved =
        session.moved ||
        screenDistancePx(session.startClientPx, {
          x: event.clientX,
          y: event.clientY,
        }) > DRAG_TOLERANCE_PX
      const next = { ...session, preview, moved }
      setSession(next)
    },
    [room, roomPoint, setSession],
  )

  const handleItemPointerUp: PlanItemPointerHandler = useCallback(
    (item, event) => {
      if (!ownsSession(dragRef.current, item, event)) return

      event.stopPropagation()
      releasePointer?.(event)
      finishDrag(true)
    },
    [finishDrag, releasePointer],
  )

  const handleItemPointerCancel: PlanItemPointerHandler = useCallback(
    (item, event) => {
      if (!ownsSession(dragRef.current, item, event)) return

      releasePointer?.(event)
      finishDrag(false)
    },
    [finishDrag, releasePointer],
  )

  const handlePointerMissed = useCallback(() => {
    // The pointerup of a committed drop reaches the canvas as a missed click;
    // do not clear the selection a second time because of it.
    if (suppressMissedRef.current) {
      suppressMissedRef.current = false
      return
    }
    onSelect?.(null)
  }, [onSelect])

  const resetPointerMissed = useCallback(() => {
    suppressMissedRef.current = false
  }, [])

  const displayItems =
    drag === null
      ? items
      : items.map((item) =>
          item.id === drag.id ? { ...item, ...drag.preview } : item,
        )

  return {
    displayItems,
    drag,
    pointerId: drag?.pointerId ?? null,
    handleItemPointerDown,
    handleItemPointerMove,
    handleItemPointerUp,
    handleItemPointerCancel,
    handlePointerMissed,
    resetPointerMissed,
    finishDrag,
  }
}
