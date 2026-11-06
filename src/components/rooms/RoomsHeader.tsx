import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** The page title, a short summary, and the always-available way to add a room. */
export function RoomsHeader({ count }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <h1 id="rooms-heading" className="text-2xl font-bold tracking-tight text-foreground">
          My rooms
        </h1>
        <p className="text-sm text-muted-foreground">
          {count === undefined
            ? 'Loading your saved rooms…'
            : count === 0
              ? 'Your saved rooms will appear here.'
              : `${count} saved room${count === 1 ? '' : 's'}, newest first.`}
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Plus aria-hidden="true" />
          New room
        </Link>
      </Button>
    </div>
  )
}
