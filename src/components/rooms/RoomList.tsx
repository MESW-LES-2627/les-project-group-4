'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LoaderCircle, TriangleAlert } from 'lucide-react'

import { listRooms } from '@/api/client'
import type { ApiError, Room } from '@/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type ListState =
  | { status: 'loading' }
  | { status: 'ready'; rooms: Room[] }
  | { status: 'error'; error: ApiError }

/** US-02: the saved rooms, newest first. */
export function RoomList() {
  const [state, setState] = useState<ListState>({ status: 'loading' })

  useEffect(() => {
    // Ignore the response if the page was left before it arrived.
    let cancelled = false
    void listRooms().then((result) => {
      if (cancelled) {
        return
      }
      setState(
        result.ok
          ? { status: 'ready', rooms: result.data }
          : { status: 'error', error: result.error },
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading rooms…
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <Alert variant="destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Could not load your rooms</AlertTitle>
        <AlertDescription>{state.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (state.rooms.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border p-6">
        <p className="text-sm text-muted-foreground">You have not created any rooms yet.</p>
        <Button asChild>
          <Link href="/">Create your first room</Link>
        </Button>
      </div>
    )
  }

  return (
    <ul className="grid gap-2">
      {state.rooms.map((room) => (
        <li key={room.id} className="grid gap-1 rounded-lg border border-border p-4">
          <span className="font-medium break-words text-foreground">{room.name}</span>
          <span className="text-sm text-muted-foreground">
            {room.widthCm} × {room.lengthCm} cm
          </span>
        </li>
      ))}
    </ul>
  )
}
