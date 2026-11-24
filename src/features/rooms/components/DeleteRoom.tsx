'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, TriangleAlert } from 'lucide-react'

import { deleteRoom } from '@/features/rooms/api'
import type { Room } from '@/features/rooms/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'
import { describeRoomDeletion } from '@/features/rooms/model/roomFormat'

/**
 * US-05: the room's delete action (AT-1). Nothing is sent until the user confirms (AT-2);
 * cancelling leaves the room as it was (AT-3). After the delete, the user goes back to the
 * room list, where the room is gone (AT-4). The saved layouts go with it (AT-5, on the server).
 */
export function DeleteRoom({ room, layoutCount }: { room: Room; layoutCount: number }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentRoom, setCurrentRoom, replaceItems } = useDraftLayouts()
  const router = useRouter()

  async function confirmDelete() {
    if (deleting) return
    setDeleting(true)
    setError(null)
    const result = await deleteRoom(room.id)
    // 404: someone else already deleted it, which is what the user wanted too.
    if (result.ok || result.error.status === 404) {
      // The unsaved plan and the catalog's "add to" target must not point at a deleted room.
      replaceItems(room.id, [])
      if (currentRoom?.id === room.id) setCurrentRoom(null)
      // replace, not push: going back must not return to the deleted room.
      router.replace('/rooms')
      return
    }
    setError(result.error.message)
    setDeleting(false)
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          setConfirming(true)
          setError(null)
        }}
      >
        <Trash2 aria-hidden="true" />
        Delete room
      </Button>
    )
  }

  return (
    <div
      role="group"
      aria-labelledby="delete-room-question"
      className="grid max-w-xs gap-2 rounded-lg border border-destructive/30 bg-background p-3"
    >
      <p id="delete-room-question" className="text-sm font-medium text-foreground">
        Delete “{room.name}”?
      </p>
      <p className="text-xs text-muted-foreground">{describeRoomDeletion(layoutCount)}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={deleting}
          onClick={confirmDelete}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={() => {
            setConfirming(false)
            setError(null)
          }}
        >
          Cancel
        </Button>
      </div>
      {error !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
