'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { CircleCheck, Save, TriangleAlert } from 'lucide-react'

import { saveLayout } from '@/features/rooms/api'
import type { LayoutSummary } from '@/features/rooms/types'
import { TextField } from '@/components/form/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { PlacedItem } from '@/features/plan/model/layout'
import { describeSaveError, toSaveLayoutRequest } from '@/lib/saveLayout'
import { formatItemCount, savedConfirmation } from '@/lib/savedLayouts'
import { LAYOUT_NAME_MAX } from '@/features/rooms/schema'

interface SaveLayoutFormProps {
  roomId: number
  /** The items currently on the plan. With none, the layout cannot be saved (AT-6). */
  items: readonly PlacedItem[]
  /** The room's saved layouts, so the "Saved …" confirmation goes away if that layout is deleted. */
  savedLayouts: readonly LayoutSummary[]
}

/** US-13b: saves the current plan as a named layout of this room. */
export function SaveLayoutForm({ roomId, items, savedLayouts }: SaveLayoutFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ id: number; name: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()
  const inFlightRef = useRef(false)

  function start() {
    setOpen(true)
    setSaved(null)
  }

  function cancel() {
    setOpen(false)
    setName('')
    setNameError(undefined)
    setFormError(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlightRef.current || items.length === 0) return

    // AT-1: a blank name is rejected here, so no request is sent.
    const prepared = toSaveLayoutRequest(name, items)
    if (!prepared.ok) {
      setNameError(prepared.nameError)
      return
    }

    inFlightRef.current = true
    setIsSaving(true)
    setFormError(null)

    try {
      const result = await saveLayout(roomId, prepared.request)
      if (result.ok) {
        // AT-2: the confirmation names the saved layout.
        setSaved({ id: result.data.id, name: result.data.name })
        setOpen(false)
        setName('')
        setNameError(undefined)
        // US-14b: reloads the server-side list of saved layouts; local state here is kept.
        startRefresh(() => router.refresh())
        return
      }
      // AT-3 / AT-4: duplicate name next to the field, anything else for the whole form. The name stays.
      const shown = describeSaveError(result.error)
      setNameError(shown.nameError)
      setFormError(shown.formError ?? null)
    } finally {
      inFlightRef.current = false
      setIsSaving(false)
    }
  }

  // Shown once the refreshed list has the new layout, and hidden again if it is deleted.
  const savedName = isRefreshing ? null : savedConfirmation(saved, savedLayouts)

  // AT-6: an empty plan cannot be saved, so both buttons are disabled and a hint says why.
  const isEmpty = items.length === 0
  const emptyHint = isEmpty ? (
    <p id="save-layout-empty-hint" className="text-xs text-muted-foreground">
      Add at least one item to save a layout.
    </p>
  ) : null

  if (!open) {
    return (
      <div className="grid justify-items-end gap-1">
        <Button
          type="button"
          onClick={start}
          disabled={isEmpty}
          aria-describedby={isEmpty ? 'save-layout-empty-hint' : undefined}
        >
          <Save aria-hidden="true" />
          Save layout
        </Button>
        {emptyHint}
        {savedName !== null ? (
          <p role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleCheck className="size-3.5 text-primary" aria-hidden="true" />
            Saved “{savedName}”.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Save layout"
      className="grid w-full gap-3 rounded-lg border border-border bg-background p-3"
    >
      <TextField
        id="layout-name"
        label="Layout name"
        value={name}
        error={nameError}
        maxLength={LAYOUT_NAME_MAX}
        autoFocus
        placeholder="e.g. Cosy corner"
        onValueChange={(value) => {
          setName(value)
          setNameError(undefined)
        }}
        onBlur={() => {}}
      />
      {emptyHint ?? (
        <p className="text-xs text-muted-foreground">
          {formatItemCount(items.length)} on the plan will be saved.
        </p>
      )}
      {formError !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isSaving || isEmpty}
          aria-describedby={isEmpty ? 'save-layout-empty-hint' : undefined}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
