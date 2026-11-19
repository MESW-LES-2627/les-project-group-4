'use client'

import Link from 'next/link'

import { useDraftLayouts } from '@/hooks/useDraftLayouts'

/**
 * US-09: says which room the catalog adds to, or how to pick one. The item count
 * gives the feedback the catalog page otherwise lacks after an add.
 */
export function CurrentRoomBanner() {
  const { currentRoom, itemsFor } = useDraftLayouts()

  if (currentRoom === null) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/rooms" className="font-medium text-foreground underline">
          Open a room
        </Link>{' '}
        to add items from here.
      </p>
    )
  }

  const count = itemsFor(currentRoom.id).length

  return (
    <p className="text-sm text-muted-foreground">
      Adding to{' '}
      <Link
        href={`/rooms/${currentRoom.id}`}
        className="font-medium text-foreground underline"
      >
        {currentRoom.name}
      </Link>
      {` · ${count === 1 ? '1 item' : `${count} items`}`}
    </p>
  )
}
