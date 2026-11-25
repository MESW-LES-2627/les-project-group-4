import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useDraftLayouts } from '@/features/plan/hooks/useDraftLayouts'

import { deleteRoom } from '../api'

/**
 * US-05: deletes a room and leaves its page. After the delete (or a 404: another tab already
 * deleted it, which is what the user wanted too), the room's unsaved plan is dropped and the
 * catalog stops adding to it, then the user goes back to the room list. `replace`, not `push`:
 * the back button must not return to the deleted room. On any other failure the room stays
 * and `error` holds the message to show.
 */
export function useDeleteRoom(roomId: number) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { forgetRoom } = useDraftLayouts()
  const router = useRouter()
  // A second click before the re-render must not send a second DELETE.
  const inFlight = useRef(false)

  async function confirm() {
    if (inFlight.current) return
    inFlight.current = true
    setIsDeleting(true)
    setError(null)

    const result = await deleteRoom(roomId)
    if (result.ok || result.error.status === 404) {
      forgetRoom(roomId)
      router.replace('/rooms')
      return
    }
    inFlight.current = false
    setError(result.error.message)
    setIsDeleting(false)
  }

  function clearError() {
    setError(null)
  }

  return { isDeleting, error, confirm, clearError }
}
