'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LoaderCircle, TriangleAlert } from 'lucide-react'

import { getRoom } from '@/api/client'
import type { ApiError, Room } from '@/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type DetailsState =
  | { status: 'loading' }
  | { status: 'ready'; room: Room }
  | { status: 'error'; error: ApiError }

/**
 * US-03: one room's details, with loading, not-found and error states.
 * The page renders it with key={id}, so another room starts from a fresh loading state.
 */
export function RoomDetails({ id }: { id: string }) {
  const [state, setState] = useState<DetailsState>({ status: 'loading' })

  useEffect(() => {
    // Ignore the response if the page was left before it arrived.
    let cancelled = false
    void getRoom(id).then((result) => {
      if (cancelled) {
        return
      }
      setState(
        result.ok
          ? { status: 'ready', room: result.data }
          : { status: 'error', error: result.error },
      )
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (state.status === 'loading') {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading room…
      </p>
    )
  }

  if (state.status === 'error') {
    // 400 (malformed id) and 404 both mean there is no room at this address.
    const notFound = state.error.status === 404 || state.error.status === 400
    return (
      <div className="grid justify-items-start gap-4">
        <Alert variant={notFound ? 'default' : 'destructive'}>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>
            <h1>{notFound ? 'Room not found' : 'Could not load this room'}</h1>
          </AlertTitle>
          <AlertDescription>
            {notFound
              ? 'There is no room at this address. It may have been deleted, or the link is wrong.'
              : state.error.message}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/rooms">Back to my rooms</Link>
        </Button>
      </div>
    )
  }

  const { room } = state
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight break-words text-foreground">
        {room.name}
      </h1>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Width</dt>
          <dd className="font-medium text-foreground">{room.widthCm} cm</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Length</dt>
          <dd className="font-medium text-foreground">{room.lengthCm} cm</dd>
        </div>
      </dl>
    </div>
  )
}
