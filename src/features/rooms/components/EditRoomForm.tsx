'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, TriangleAlert } from 'lucide-react'

import { TextField } from '@/components/form/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { PlacedItem } from '@/features/plan/model/layout'
import { updateRoom } from '@/features/rooms/api'
import { useRoomForm } from '@/features/rooms/hooks/useRoomForm'
import { describeItemsOutside, itemsOutsideRoom } from '@/features/rooms/model/roomEdit'
import {
  mapServerFieldErrors,
  toRoomFormValues,
  toUpdateRoomRequest,
  type RoomFormField,
} from '@/features/rooms/model/roomValidation'
import { ROOM_NAME_MAX } from '@/features/rooms/schema'
import type { Room, UpdateRoomRequest } from '@/features/rooms/types'

interface EditRoomFormProps {
  room: Room
  /** The room's unsaved plan, checked against the new dimensions (AT-4). */
  placedItems: readonly PlacedItem[]
  onSaved: () => void
  onCancel: () => void
}

/**
 * US-04: edits the room's name and dimensions. Starts with the current values (AT-1) and
 * uses the create-room validation, so nothing is sent while a field is invalid (AT-2).
 * After a save the page reloads the room from the server (AT-3). Dimensions that would
 * leave placed items outside the room ask for confirmation first (AT-4).
 */
export function EditRoomForm({ room, placedItems, onSaved, onCancel }: EditRoomFormProps) {
  const form = useRoomForm(toRoomFormValues(room))
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // AT-4: the request waiting for "Save anyway", with the warning to show.
  const [pending, setPending] = useState<{ request: UpdateRoomRequest; message: string } | null>(
    null,
  )

  /** The form's field props; any change drops a pending warning, which was for the old values. */
  function fieldProps(field: RoomFormField) {
    const props = form.getFieldProps(field)
    return {
      ...props,
      onValueChange: (value: string) => {
        setPending(null)
        props.onValueChange(value)
      },
    }
  }

  async function save(request: UpdateRoomRequest) {
    // The submit and "Save anyway" buttons are disabled while saving, so there is one request at a time.
    setSaving(true)
    setSubmitError(null)
    try {
      const result = await updateRoom(room.id, request)
      if (result.ok) {
        setPending(null)
        router.refresh()
        onSaved()
        return
      }
      const fieldErrors = mapServerFieldErrors(result.error.fieldErrors)
      if (Object.keys(fieldErrors).length > 0) {
        setPending(null)
        form.applyServerErrors(fieldErrors)
        return
      }
      setSubmitError(result.error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      aria-labelledby="edit-room-heading"
      className="grid gap-3 rounded-lg border border-border bg-card p-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const request = toUpdateRoomRequest(values)
        if (request === null) return
        const outside = itemsOutsideRoom(placedItems, request)
        if (outside.length > 0) {
          setSubmitError(null)
          setPending({ request, message: describeItemsOutside(outside) })
          return
        }
        return save(request)
      })}
    >
      <h2 id="edit-room-heading" className="text-sm font-semibold text-foreground">
        Edit room
      </h2>

      <TextField
        {...fieldProps('name')}
        name="name"
        label="Room name"
        maxLength={ROOM_NAME_MAX}
        autoComplete="off"
        spellCheck={false}
        required
      />

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <TextField
          {...fieldProps('width')}
          name="width"
          label="Width (cm)"
          inputMode="numeric"
          autoComplete="off"
          required
        />
        <TextField
          {...fieldProps('length')}
          name="length"
          label="Length (cm)"
          inputMode="numeric"
          autoComplete="off"
          required
        />
      </div>

      {pending !== null ? (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Some items will not fit</AlertTitle>
          <AlertDescription>
            <p>{pending.message} They stay where they are and are shown outside the room.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => save(pending.request)}
              >
                {saving ? 'Saving…' : 'Save anyway'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={() => setPending(null)}
              >
                Change dimensions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" aria-busy={saving} disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}

      {submitError !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Could not save the room</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
