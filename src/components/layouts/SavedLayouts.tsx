'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Trash2, TriangleAlert } from 'lucide-react'

import { deleteLayout, getLayout } from '@/api/client'
import type { LayoutSummary } from '@/api/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDraftLayouts } from '@/hooks/useDraftLayouts'
import {
  describeOpenError,
  formatItemCount,
  isAlreadyDeleted,
  needsReplaceConfirmation,
  toDraftItems,
  visibleLayouts,
} from '@/lib/savedLayouts'

interface SavedLayoutsProps {
  roomId: number
  /** Loaded on the server, by name. A save refreshes the route, so a new layout shows up here. */
  layouts: readonly LayoutSummary[]
}

/** US-14b: the room's saved layouts, with open and delete. */
export function SavedLayouts({ roomId, layouts }: SavedLayoutsProps) {
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<number>>(new Set())
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<{ id: number; message: string } | null>(null)
  const [replacingId, setReplacingId] = useState<number | null>(null)
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)
  const { itemsFor, replaceItems } = useDraftLayouts()
  const router = useRouter()
  const [, startRefresh] = useTransition()

  const shown = visibleLayouts(layouts, deletedIds)

  async function confirmDelete(layout: LayoutSummary) {
    if (deletingId !== null) return
    setDeletingId(layout.id)
    setError(null)
    try {
      const result = await deleteLayout(roomId, layout.id)
      if (result.ok || isAlreadyDeleted(result.error)) {
        // AT-5: it leaves the list; the plan is not touched.
        setDeletedIds((ids) => new Set(ids).add(layout.id))
        setConfirmingId(null)
        // Reloads the room's layouts, so the save form's "Saved …" confirmation also goes away.
        startRefresh(() => router.refresh())
        return
      }
      setError({ id: layout.id, message: result.error.message })
    } finally {
      setDeletingId(null)
    }
  }

  const busy = deletingId !== null || openingId !== null

  function startOpen(layout: LayoutSummary) {
    setError(null)
    setNotFound(null)
    setConfirmingId(null)
    // AT-4: the plan has items, so ask before replacing them.
    if (needsReplaceConfirmation(itemsFor(roomId))) {
      setReplacingId(layout.id)
      return
    }
    void openLayout(layout)
  }

  async function openLayout(layout: LayoutSummary) {
    if (openingId !== null) return
    setOpeningId(layout.id)
    try {
      const result = await getLayout(roomId, layout.id)
      if (result.ok) {
        // AT-3: the saved items, positions and rotations replace the plan.
        replaceItems(roomId, toDraftItems(result.data))
        setReplacingId(null)
        return
      }
      const failure = describeOpenError(result.error)
      setReplacingId(null)
      if (failure.missing) {
        // AT-6: the plan is not touched, and the layout leaves the list.
        setNotFound(failure.message)
        setDeletedIds((ids) => new Set(ids).add(layout.id))
        startRefresh(() => router.refresh())
        return
      }
      setError({ id: layout.id, message: failure.message })
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <section aria-labelledby="saved-layouts-heading" className="grid gap-3">
      <h2 id="saved-layouts-heading" className="text-sm font-semibold text-foreground">
        Saved layouts
      </h2>

      {notFound !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{notFound}</AlertDescription>
        </Alert>
      ) : null}

      {shown.length === 0 ? (
        // AT-2
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          No saved layouts yet. Use “Save layout” to keep the current plan.
        </p>
      ) : (
        // AT-1
        <ul className="grid gap-2">
          {shown.map((layout) => {
            const confirming = confirmingId === layout.id
            const deleting = deletingId === layout.id
            const replacing = replacingId === layout.id
            const opening = openingId === layout.id
            return (
              <li
                key={layout.id}
                className="grid gap-2 rounded-lg border border-border p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="grid gap-0.5">
                  <span className="font-medium wrap-break-word text-foreground">{layout.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatItemCount(layout.itemCount)}
                  </span>
                </div>

                {confirming ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-foreground">Delete “{layout.name}”?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deleting}
                      onClick={() => confirmDelete(layout)}
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deleting}
                      onClick={() => {
                        setConfirmingId(null)
                        setError(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : replacing ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-foreground">
                      Replace the current plan with “{layout.name}”?
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={opening}
                      onClick={() => openLayout(layout)}
                    >
                      {opening ? 'Opening…' : 'Replace'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={opening}
                      onClick={() => setReplacingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Open ${layout.name}`}
                      disabled={busy}
                      onClick={() => startOpen(layout)}
                    >
                      <FolderOpen aria-hidden="true" />
                      {opening ? 'Opening…' : 'Open'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${layout.name}`}
                      disabled={busy}
                      onClick={() => {
                        setConfirmingId(layout.id)
                        setReplacingId(null)
                        setError(null)
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                )}

                {error?.id === layout.id ? (
                  <Alert variant="destructive" className="sm:basis-full">
                    <TriangleAlert aria-hidden="true" />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
