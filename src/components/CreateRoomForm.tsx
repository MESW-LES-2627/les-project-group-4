'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import { LoaderCircle, TriangleAlert } from 'lucide-react'

import type { City } from '@/api/types'
import { CreateRoomSuccess } from '@/components/CreateRoomSuccess'
import { LocationField } from '@/components/form/LocationField'
import { TextField } from '@/components/form/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCreateRoom } from '@/hooks/useCreateRoom'
import { useRoomForm } from '@/hooks/useRoomForm'
import {
  parseSavedLocation,
  readLastLocationRaw,
  saveLastLocation,
  toLocationInput,
} from '@/lib/location'
import { NAME_MAX_LENGTH } from '@/lib/roomValidation'
import type { RoomLocationInput } from '@/lib/roomValidation'

// The stored location only changes when this form writes it, so there is nothing to subscribe to.
function subscribe() {
  return () => {}
}

// The server cannot see the browser's storage: no saved location while rendering there.
function getServerRaw(): string | null {
  return null
}

/** US-01 + US-15: `cities` is loaded on the server by the page. */
export function CreateRoomForm({ cities }: { cities: City[] }) {
  const form = useRoomForm()

  // US-15 AT-5: until the user picks something, the form uses the last room's location.
  // A city that no longer exists is ignored.
  const savedRaw = useSyncExternalStore(subscribe, readLastLocationRaw, getServerRaw)
  const savedLocation = useMemo<RoomLocationInput>(() => {
    const saved = parseSavedLocation(savedRaw)
    if (saved.cityId !== undefined && !cities.some((city) => city.id === saved.cityId)) {
      return {}
    }
    return saved
  }, [savedRaw, cities])

  // null = the user has not chosen a location yet.
  const [chosenLocation, setChosenLocation] = useState<RoomLocationInput | null>(null)
  const [keptForNextRoom, setKeptForNextRoom] = useState(false)
  const location = chosenLocation ?? savedLocation
  const reusedLocation =
    chosenLocation === null ? Object.keys(savedLocation).length > 0 : keptForNextRoom
  const {
    isSubmitting,
    submitError,
    locationError,
    clearLocationError,
    createdRoom,
    submit,
    reset: resetCreateRoom,
  } = useCreateRoom({
    onFieldErrors: form.applyServerErrors,
  })
  const [focusNameOnMount, setFocusNameOnMount] = useState(false)
  // US-15: no submitting while "Use my location" is still waiting for the browser.
  const [isLocating, setIsLocating] = useState(false)

  // Remember the location that was actually saved with the room.
  useEffect(() => {
    if (createdRoom !== null) {
      saveLastLocation(toLocationInput(createdRoom))
    }
  }, [createdRoom])

  function handleLocationChange(next: RoomLocationInput) {
    setChosenLocation(next)
    setKeptForNextRoom(false)
    clearLocationError()
  }

  function handleCreateAnother() {
    setFocusNameOnMount(true)
    form.reset()
    // AT-5: keep the location for the next room instead of asking again.
    setChosenLocation(location)
    setKeptForNextRoom(Object.keys(location).length > 0)
    resetCreateRoom()
  }

  if (createdRoom !== null) {
    return (
      <CreateRoomSuccess
        room={createdRoom}
        onCreateAnother={handleCreateAnother}
      />
    )
  }

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        if (!isLocating) {
          return submit(values, location)
        }
      })}
    >
      <TextField
        {...form.getFieldProps('name')}
        name="name"
        label="Room name"
        placeholder="e.g. Bedroom"
        maxLength={NAME_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        autoFocus={focusNameOnMount}
        required
      />

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <TextField
          {...form.getFieldProps('width')}
          name="width"
          label="Width (cm)"
          placeholder="e.g. 300"
          inputMode="numeric"
          autoComplete="off"
          required
        />
        <TextField
          {...form.getFieldProps('length')}
          name="length"
          label="Length (cm)"
          placeholder="e.g. 400"
          inputMode="numeric"
          autoComplete="off"
          required
        />
      </div>

      <LocationField
        id="room-location"
        cities={cities}
        value={location}
        onChange={handleLocationChange}
        reused={reusedLocation}
        onLocatingChange={setIsLocating}
        serverError={locationError}
      />

      <Button
        type="submit"
        aria-busy={isSubmitting}
        disabled={isLocating}
        className="h-11 w-full px-6 text-[15px] sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Creating…
          </>
        ) : (
          'Create room'
        )}
      </Button>

      {/* Kept below the button so submission errors do not shift the form. */}
      {submitError !== null ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Could not create room</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
