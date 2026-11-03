'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CircleCheck } from 'lucide-react'

import type { Room } from '@/api/types'
import { Button } from '@/components/ui/button'

interface CreateRoomSuccessProps {
  room: Room
  onCreateAnother: () => void
}

export function CreateRoomSuccess({
  room,
  onCreateAnother,
}: CreateRoomSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
        <CircleCheck
          className="mt-0.5 size-5 shrink-0 text-success"
          aria-hidden="true"
        />
        <div className="grid gap-1">
          <h2
            ref={headingRef}
            tabIndex={-1}
            aria-describedby="created-room-details"
            className="text-base font-semibold text-foreground focus:outline-none"
          >
            Room created
          </h2>
          <p
            id="created-room-details"
            className="text-sm break-words text-muted-foreground"
          >
            <span className="font-medium text-foreground">{room.name}</span>
            {' · '}
            {room.widthCm} × {room.lengthCm} cm
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="h-11 w-full px-6 text-[15px] sm:w-auto">
          <Link href={`/rooms/${room.id}`}>View room</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCreateAnother}
          className="h-11 w-full px-6 text-[15px] sm:w-auto"
        >
          Create another room
        </Button>
      </div>
    </div>
  )
}
