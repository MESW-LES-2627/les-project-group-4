import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/** Shown by /rooms/[id] when the id is malformed or no room has it. */
export default function RoomNotFound() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-2xl content-start justify-items-start gap-4">
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>
            <h1>Room not found</h1>
          </AlertTitle>
          <AlertDescription>
            There is no room at this address. It may have been deleted, or the link is wrong.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/rooms">Back to my rooms</Link>
        </Button>
      </section>
    </main>
  )
}
