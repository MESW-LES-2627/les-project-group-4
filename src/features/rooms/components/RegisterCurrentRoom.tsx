'use client'

import { useEffect } from 'react'

import type { Room } from '@/features/rooms/types'
import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'

/**
 * US-09: remembers the room the user opened, so the catalog page can add to it.
 * It is deliberately not cleared on unmount: the last room opened stays the
 * target until another room is opened.
 */
export function RegisterCurrentRoom({ room }: { room: Room }) {
  const { setCurrentRoom } = useDraftLayouts()

  useEffect(() => {
    setCurrentRoom({
      id: room.id,
      name: room.name,
      widthCm: room.widthCm,
      lengthCm: room.lengthCm,
    })
  }, [room.id, room.name, room.widthCm, room.lengthCm, setCurrentRoom])

  return null
}
