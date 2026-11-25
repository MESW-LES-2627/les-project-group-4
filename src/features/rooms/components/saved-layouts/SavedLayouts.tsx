'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Trash2, TriangleAlert } from 'lucide-react'

import { deleteLayout, getLayout } from '@/features/rooms/api'
import type { LayoutSummary, LayoutWithItems, Room } from '@/features/rooms/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { LayoutThumbnail } from '@/features/rooms/components/saved-layouts/LayoutThumbnail'
import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'
import {
  describeOpenError,
  formatItemCount,
  isAlreadyDeleted,
  needsReplaceConfirmation,
  toDraftItems,
} from '@/features/rooms/model/savedLayouts'

interface SavedLayoutsProps {
  room: Room
  roomId: number
  /**
   * The layouts to show (without the ones deleted on this page, see useRoomLayouts), with
   * their items so every card can draw a miniature of the plan.
   */
  layouts: readonly LayoutWithItems[]
  /** A layout was deleted here, or turned out to be gone already: it leaves the list. */
  onLayoutGone: (layoutId: number) => void
  /** The save card, shown in the section header. */
  children?: ReactNode
}

/** US-14b: the room's saved layouts, with open and delete. */
export function SavedLayouts({ room, roomId, layouts, onLayoutGone, children }: SavedLayoutsProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<{ id: number; message: string } | null>(null)
  const [replacingId, setReplacingId] = useState<number | null>(null)
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)
  const { itemsFor, replaceItems } = useDraftLayouts()
  const router = useRouter()
  const [, startRefresh] = useTransition()

  async function confirmDelete(layout: LayoutSummary) {
    if (deletingId !== null) return
    setDeletingId(layout.id)
    setError(null)
    try {
      const result = await deleteLayout(roomId, layout.id)
      if (result.ok || isAlreadyDeleted(result.error)) {
        // AT-5: it leaves the list; the plan is not touched.
        onLayoutGone(layout.id)
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
        onLayoutGone(layout.id)
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="saved-layouts-heading" className="text-sm font-semibold text-foreground">
          Saved layouts
        </h2>
        {children}
      </div>

      {notFound !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{notFound}</AlertDescription>
        </Alert>
      ) : null}

      {layouts.length === 0 ? (
        // AT-2
        <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          Save this plan to compare arrangements later.
        </p>
      ) : (
        // AT-1
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {layouts.map((layout) => {
            const confirming = confirmingId === layout.id
            const deleting = deletingId === layout.id
            const replacing = replacingId === layout.id
            const opening = openingId === layout.id
            return (
              <div
                key={layout.id}
                className="flex h-full flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 transition duration-200 hover:shadow-md hover:ring-brand/40"
              >
                <button
                  type="button"
                  onClick={() => startOpen(layout)}
                  disabled={busy || confirming || replacing}
                  aria-label={`Open ${layout.name}`}
                  className="group flex flex-1 flex-col text-left focus-visible:outline-none disabled:cursor-default"
                >
                  <LayoutThumbnail room={room} layoutId={layout.id} items={layout.items} />
                  <span className="flex items-start justify-between gap-2 p-3">
                    <span className="grid gap-0.5">
                      <span className="text-sm font-medium wrap-break-word text-foreground">
                        {layout.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatItemCount(layout.itemCount)}
                      </span>
                    </span>
                    <ChevronRight
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <div className="px-3 pb-3">
                  {confirming ? (
                    <div className="grid gap-2">
                      <span className="text-sm text-foreground">
                        Delete “{layout.name}”?
                      </span>
                      <div className="flex flex-wrap gap-2">
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
                    </div>
                  ) : replacing ? (
                    <div className="grid gap-2">
                      <span className="text-sm text-foreground">
                        Replace the current plan with “{layout.name}”?
                      </span>
                      <div className="flex flex-wrap gap-2">
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
                    </div>
                  ) : opening ? (
                    <p className="text-sm text-muted-foreground">Opening…</p>
                  ) : (
                    <div className="flex justify-end">
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
                    <Alert variant="destructive" className="mt-2">
                      <TriangleAlert aria-hidden="true" />
                      <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
