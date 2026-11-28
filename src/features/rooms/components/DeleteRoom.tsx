'use client'

import { useState } from 'react'
import { Trash2, TriangleAlert } from 'lucide-react'

import type { Room } from '@/features/rooms/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteRoom } from '@/features/rooms/hooks/useDeleteRoom'
import { describeRoomDeletion } from '@/features/rooms/model/roomFormat'

/**
 * US-05: the room's delete action (AT-1). It opens a confirmation dialog, so the header does
 * not move and focus goes into the dialog and back to the button. Nothing is sent until the
 * user confirms (AT-2); Cancel, Escape or a click outside leave the room as it was (AT-3).
 * `layoutCount` is the number of saved layouts the page shows, so the warning matches them.
 */
export function DeleteRoom({ room, layoutCount }: { room: Room; layoutCount: number }) {
  const [open, setOpen] = useState(false)
  const { isDeleting, error, confirm, clearError } = useDeleteRoom(room.id)

  function handleOpenChange(next: boolean) {
    // While the request runs, the dialog stays open so its result (or error) is seen.
    if (isDeleting) return
    if (!next) clearError()
    setOpen(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
          <Trash2 aria-hidden="true" />
          Delete room
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-break-word">Delete “{room.name}”?</AlertDialogTitle>
          <AlertDialogDescription>{describeRoomDeletion(layoutCount)}</AlertDialogDescription>
        </AlertDialogHeader>

        {error !== null ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {/* A plain button, not AlertDialogAction: the dialog must stay open until the delete finishes. */}
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={confirm}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
