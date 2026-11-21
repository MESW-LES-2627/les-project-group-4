import { useRef, useState } from 'react'

import { createRoom } from '@/features/rooms/api'
import type { Room } from '@/features/rooms/types'
import { mapServerFieldErrors, pickLocationError, toCreateRoomRequest } from '@/features/rooms/model/roomValidation'
import type { RoomLocationInput } from '@/features/locations/schema'
import type { RoomFormErrors, RoomFormValues } from '@/features/rooms/model/roomValidation'

interface UseCreateRoomOptions {
  onFieldErrors: (errors: RoomFormErrors) => void
}

export function useCreateRoom({ onFieldErrors }: UseCreateRoomOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // US-15: a location the server rejected, shown on the location field.
  const [locationError, setLocationError] = useState<string | null>(null)
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
    setLocationError(null)
    setCreatedRoom(null)

    try {
      const result = await createRoom(request)

      if (result.ok) {
        setCreatedRoom(result.data)
        return
      }

      const fieldErrors = mapServerFieldErrors(result.error.fieldErrors)
      const rejectedLocation = pickLocationError(result.error.fieldErrors)
      if (rejectedLocation !== undefined) {
        setLocationError(rejectedLocation)
      }
      if (Object.keys(fieldErrors).length > 0) {
        onFieldErrors(fieldErrors)
      }
      if (rejectedLocation !== undefined || Object.keys(fieldErrors).length > 0) {
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
    setLocationError(null)
    setCreatedRoom(null)
  }

  function clearLocationError() {
    setLocationError(null)
  }

  return {
    isSubmitting,
    submitError,
    locationError,
    clearLocationError,
    createdRoom,
    submit,
    reset,
  }
}
