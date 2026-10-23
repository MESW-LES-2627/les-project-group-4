'use client'

import { useState } from 'react'

import { LoaderCircle, TriangleAlert } from 'lucide-react'

import { CreateRoomSuccess } from '@/components/CreateRoomSuccess'
import { TextField } from '@/components/form/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCreateRoom } from '@/hooks/useCreateRoom'
import { useRoomForm } from '@/hooks/useRoomForm'
import { NAME_MAX_LENGTH } from '@/lib/roomValidation'

export function CreateRoomForm() {
  const form = useRoomForm()
  const {
    isSubmitting,
    submitError,
    createdRoom,
    submit,
    reset: resetCreateRoom,
  } = useCreateRoom({
    onFieldErrors: form.applyServerErrors,
  })
  const [focusNameOnMount, setFocusNameOnMount] = useState(false)

  function handleCreateAnother() {
    setFocusNameOnMount(true)
    form.reset()
    resetCreateRoom()
  }

  if (createdRoom !== null) {
    return (
      <CreateRoomSuccess
        room={createdRoom}
        onCreateAnother={handleCreateAnother}
      />
    )
  }

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <TextField
        {...form.getFieldProps('name')}
        name="name"
        label="Room name"
        placeholder="e.g. Bedroom"
        maxLength={NAME_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        autoFocus={focusNameOnMount}
        required
      />

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <TextField
          {...form.getFieldProps('width')}
          name="width"
          label="Width (cm)"
          placeholder="e.g. 300"
          inputMode="numeric"
          autoComplete="off"
          required
        />
        <TextField
          {...form.getFieldProps('length')}
          name="length"
          label="Length (cm)"
          placeholder="e.g. 400"
          inputMode="numeric"
          autoComplete="off"
          required
        />
      </div>

      <Button
        type="submit"
        aria-busy={isSubmitting}
        className="h-11 w-full px-6 text-[15px] sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Creating…
          </>
        ) : (
          'Create room'
        )}
      </Button>

      {/* Kept below the button so submission errors do not shift the form. */}
      {submitError !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Could not create room</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
