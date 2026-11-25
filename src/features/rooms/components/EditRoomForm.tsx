'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle, TriangleAlert } from 'lucide-react'

import { TextField } from '@/components/form/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { PlacedItem } from '@/features/plan/model/layout'
import { useRoomForm } from '@/features/rooms/hooks/useRoomForm'
import { useUpdateRoom } from '@/features/rooms/hooks/useUpdateRoom'
import {
  describeItemsOutside,
  findItemsOutside,
  hasItemsOutside,
} from '@/features/rooms/model/roomEdit'
import {
  toRoomFormValues,
  toUpdateRoomRequest,
  type RoomFormField,
} from '@/features/rooms/model/roomValidation'
import { ROOM_NAME_MAX } from '@/features/rooms/schema'
import type { LayoutWithItems, Room, UpdateRoomRequest } from '@/features/rooms/types'

interface EditRoomFormProps {
  room: Room
  placedItems: readonly PlacedItem[]
  savedLayouts: readonly LayoutWithItems[]
  onSavingChange: (saving: boolean) => void
  onSaved: () => void
  onCancel: () => void
}

/**
 * US-04: the edit form inside the EditRoom dialog. Starts with the current values (AT-1) and
 * uses the create-room validation, so nothing is sent while a field is invalid (AT-2). Saving
 * is useUpdateRoom (AT-3). Dimensions that would leave placed items outside the room, in the
 * current plan or in a saved layout, ask for confirmation first (AT-4).
 */
export function EditRoomForm({
  room,
  placedItems,
  savedLayouts,
  onSavingChange,
  onSaved,
  onCancel,
}: EditRoomFormProps) {
  const form = useRoomForm(toRoomFormValues(room))
  // AT-4: the request waiting for "Save anyway", with the warning to show.
  const [pending, setPending] = useState<{ request: UpdateRoomRequest; lines: string[] } | null>(
    null,
  )
  const { isSaving, submitError, save, clearError } = useUpdateRoom(room.id, {
    onFieldErrors: (errors) => {
      setPending(null)
      form.applyServerErrors(errors)
    },
    onSaved,
  })

  useEffect(() => {
    onSavingChange(isSaving)
  }, [isSaving, onSavingChange])

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

  return (
    <form
      aria-label="Edit room"
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const request = toUpdateRoomRequest(values)
        if (request === null) return
        const report = findItemsOutside(placedItems, savedLayouts, request)
        if (hasItemsOutside(report)) {
          clearError()
          setPending({ request, lines: describeItemsOutside(report) })
          return
        }
        return save(request)
      })}
    >
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
            {pending.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>They stay where they are and are shown outside the room.</p>
          </AlertDescription>
        </Alert>
      ) : null}

      {submitError !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Could not save the room</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {pending !== null ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => setPending(null)}
            >
              Change dimensions
            </Button>
            <Button type="button" disabled={isSaving} onClick={() => save(pending.request)}>
              {isSaving ? 'Saving…' : 'Save anyway'}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" aria-busy={isSaving} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </>
        )}
      </div>
    </form>
  )
}
