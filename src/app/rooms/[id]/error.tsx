'use client' // Error boundaries must be Client Components

import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/** Shown when /rooms/[id] fails to load the room (replaces the list's error.tsx here). */
export default function RoomError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-2xl content-start justify-items-start gap-4">
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>
            <h1>Could not load this room</h1>
          </AlertTitle>
          <AlertDescription>
            The server is unavailable right now. Please try again later.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* retry() renders the page again on the server, so the room is loaded again. */}
          <Button type="button" onClick={() => retry()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/rooms">Back to my rooms</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
