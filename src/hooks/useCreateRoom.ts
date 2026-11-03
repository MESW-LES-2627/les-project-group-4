import { useRef, useState } from 'react'

import { createRoom } from '@/api/client'
import type { Room } from '@/api/types'
import { mapServerFieldErrors, toCreateRoomRequest } from '@/lib/roomValidation'
import type { RoomFormErrors, RoomFormValues, RoomLocationInput } from '@/lib/roomValidation'

interface UseCreateRoomOptions {
  onFieldErrors: (errors: RoomFormErrors) => void
}

export function useCreateRoom({ onFieldErrors }: UseCreateRoomOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null)
  const inFlightRef = useRef(false)

  async function submit(values: RoomFormValues, location: RoomLocationInput = {}) {
    if (inFlightRef.current) {
      return
    }

    const request = toCreateRoomRequest(values, location)
    if (request === null) {
      return
    }

    inFlightRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    setCreatedRoom(null)

    try {
      const result = await createRoom(request)

      if (result.ok) {
        setCreatedRoom(result.data)
        return
      }

      const fieldErrors = mapServerFieldErrors(result.error.fieldErrors)
      if (Object.keys(fieldErrors).length > 0) {
        onFieldErrors(fieldErrors)
        return
      }

      setSubmitError(result.error.message)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      inFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  function reset() {
    setSubmitError(null)
    setCreatedRoom(null)
  }

  return {
    isSubmitting,
    submitError,
    createdRoom,
    submit,
    reset,
  }
}
