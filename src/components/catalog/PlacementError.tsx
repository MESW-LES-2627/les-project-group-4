'use client'

import { X } from 'lucide-react'

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDraftLayouts } from '@/hooks/useDraftLayouts'

/**
 * US-09 AT-5: why the last add to this room failed. The draft keeps the error
 * until the room adds or removes something successfully, or it is dismissed.
 */
export function PlacementError({ roomId }: { roomId: number }) {
  const { errorFor, dismissError } = useDraftLayouts()
  const message = errorFor(roomId)

  if (message === null) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss"
          onClick={() => dismissError(roomId)}
        >
          <X aria-hidden="true" />
        </Button>
      </AlertAction>
    </Alert>
  )
}
