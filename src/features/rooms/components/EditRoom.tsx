'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { PlacedItem } from '@/features/plan/model/layout'
import { EditRoomForm } from '@/features/rooms/components/EditRoomForm'
import type { LayoutWithItems, Room } from '@/features/rooms/types'

interface EditRoomProps {
  room: Room
  /** The room's current (unsaved) plan, checked against the new dimensions (AT-4). */
  placedItems: readonly PlacedItem[]
  /** The saved layouts the page shows, also checked (AT-4). */
  savedLayouts: readonly LayoutWithItems[]
}

/**
 * US-04: the room's edit action. The form opens in a dialog, so the page does not move and
 * focus goes into the form and back to the button. The form is mounted each time the dialog
 * opens, so it always starts from the room's current values (AT-1).
 */
export function EditRoom({ room, placedItems, savedLayouts }: EditRoomProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // While the request runs, the dialog stays open so its result (or error) is seen.
        if (!saving) setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
          <Pencil aria-hidden="true" />
          Edit room
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Edit room</DialogTitle>
          <DialogDescription>Change the name or the dimensions in centimetres.</DialogDescription>
        </DialogHeader>
        <EditRoomForm
          room={room}
          placedItems={placedItems}
          savedLayouts={savedLayouts}
          onSavingChange={setSaving}
          onSaved={() => {
            // The form unmounts with the dialog, so it cannot report the end of the save itself.
            setSaving(false)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
