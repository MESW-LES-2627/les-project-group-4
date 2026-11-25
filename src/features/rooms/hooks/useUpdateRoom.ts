import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { updateRoom } from '../api'
import { mapServerFieldErrors } from '../model/roomValidation'
import type { RoomFormErrors } from '../model/roomValidation'
import type { UpdateRoomRequest } from '../types'

interface UseUpdateRoomOptions {
  /** The server rejected some fields (400): show them on the form. */
  onFieldErrors: (errors: RoomFormErrors) => void
  /** Saved: the page is reloading the room from the server. */
  onSaved: () => void
}

/**
 * US-04: saves a room's new name and dimensions (AT-3). After a save, `router.refresh()`
 * renders the page again with the room from the database, so the header, the plan and the
 * catalog's target room all show the new values. Mirrors useCreateRoom.
 */
export function useUpdateRoom(roomId: number, { onFieldErrors, onSaved }: UseUpdateRoomOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  // A second submit before the re-render must not send a second PATCH.
  const inFlight = useRef(false)

  async function save(request: UpdateRoomRequest): Promise<void> {
    if (inFlight.current) return
    inFlight.current = true
    setIsSaving(true)
    setSubmitError(null)
    try {
      const result = await updateRoom(roomId, request)
      if (result.ok) {
        router.refresh()
        onSaved()
        return
      }
      const fieldErrors = mapServerFieldErrors(result.error.fieldErrors)
      if (Object.keys(fieldErrors).length > 0) {
        onFieldErrors(fieldErrors)
        return
      }
      setSubmitError(result.error.message)
    } finally {
      inFlight.current = false
      setIsSaving(false)
    }
  }

  function clearError() {
    setSubmitError(null)
  }

  return { isSaving, submitError, save, clearError }
}
