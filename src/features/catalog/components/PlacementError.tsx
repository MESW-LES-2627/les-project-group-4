'use client'

import { X } from 'lucide-react'

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'

/**
 * US-09 AT-5: why the last add failed. Without an explicit room it follows the
 * last room opened, which is what the catalog page adds to. The draft keeps the
 * error until the room adds or removes something successfully, or it is dismissed.
 */
export function PlacementError({ roomId }: { roomId?: number }) {
  const { currentRoom, errorFor, dismissError } = useDraftLayouts()
  const target = roomId ?? currentRoom?.id

  if (target === undefined) {
    return null
  }

  const message = errorFor(target)
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
          onClick={() => dismissError(target)}
        >
          <X aria-hidden="true" />
        </Button>
      </AlertAction>
    </Alert>
  )
}
