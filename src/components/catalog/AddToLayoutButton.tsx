'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

import type { CatalogItem } from '@/api/types'
import { Button } from '@/components/ui/button'
import { useDraftLayouts } from '@/hooks/useDraftLayouts'
import type { CurrentRoom } from '@/hooks/useDraftLayouts'

/**
 * US-09: adds a catalog item to a room's draft. The room page passes its own
 * room; on the catalog page the last room opened in the session is used, or a
 * link asks the user to open one first.
 */
export function AddToLayoutButton({
  item,
  room,
}: {
  item: CatalogItem
  room?: CurrentRoom
}) {
  const { currentRoom, addItem } = useDraftLayouts()
  const target = room ?? currentRoom

  if (target === null) {
    return (
      <Link href="/rooms" className="text-xs font-medium text-foreground underline">
        Open a room to add
      </Link>
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-label={`Add ${item.name} to ${target.name}`}
      onClick={() => addItem(target.id, target, item)}
    >
      <Plus aria-hidden="true" />
      Add
    </Button>
  )
}
