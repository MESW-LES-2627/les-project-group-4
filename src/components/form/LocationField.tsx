'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { LoaderCircle, LocateFixed } from 'lucide-react'

import type { City } from '@/features/locations/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  citiesUnavailableMessage,
  createRequestGuard,
  formatAccuracy,
  GEOLOCATION_MESSAGES,
  getGeolocationSupport,
  messageForPositionError,
} from '@/features/locations/model/geolocation'
import type { GeolocationSupport } from '@/features/locations/model/geolocation'
import { CURRENT_LOCATION_LABEL } from '@/features/locations/model/location'
import type { RoomLocationInput } from '@/features/locations/schema'

/** AT-4: reads the browser's secure-context flag and geolocation support. */
function getBrowserSupport(): GeolocationSupport {
  return getGeolocationSupport(window.isSecureContext, 'geolocation' in navigator)
}

// The support never changes while the page is open, so there is nothing to subscribe to.
function subscribe() {
  return () => {}
}

// The server has no browser: null until the page is hydrated.
function getServerSupport(): GeolocationSupport | null {
  return null
}

const SELECT_CLASSES =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30'

interface LocationFieldProps {
  id: string
  cities: City[]
  value: RoomLocationInput
  onChange: (value: RoomLocationInput) => void
  /** AT-5: true while the value is the location reused from the last room. */
  reused?: boolean
  /** Lets the form block submitting while the browser is still looking up the position. */
  onLocatingChange?: (isLocating: boolean) => void
  /** A location the server rejected (e.g. a city that was removed). Cleared by the form. */
  serverError?: string | null
  /** The city list could not be loaded, so only "Use my location" or no location are left. */
  citiesFailed?: boolean
}

/** US-15: pick a seeded city, or use the browser's coordinates (no reverse geocoding). */
export function LocationField({
  id,
  cities,
  value,
  onChange,
  reused = false,
  onLocatingChange,
  serverError = null,
  citiesFailed = false,
}: LocationFieldProps) {
  const support = useSyncExternalStore(subscribe, getBrowserSupport, getServerSupport)
  const [isLocating, setIsLocatingState] = useState(false)
  // Only the latest lookup may change the value (see createRequestGuard).
  const [guard] = useState(createRequestGuard)
  const [error, setError] = useState<string | null>(null)
  // Accuracy of the last browser position, in metres. Only shown, never saved.
  const [accuracy, setAccuracy] = useState<number | null>(null)

  // A lookup still running when the form goes away (e.g. the room was created) is ignored.
  useEffect(() => () => guard.cancel(), [guard])

  function setIsLocating(next: boolean) {
    setIsLocatingState(next)
    onLocatingChange?.(next)
  }

  const hasCoordinates = value.latitude !== undefined && value.longitude !== undefined
  let selectValue = ''
  if (value.cityId !== undefined) {
    selectValue = String(value.cityId)
  } else if (hasCoordinates) {
    selectValue = 'current'
  }

  function handleSelect(next: string) {
    // Picking from the list wins over a lookup that has not answered yet.
    guard.cancel()
    if (isLocating) {
      setIsLocating(false)
    }
    setError(null)
    if (next === 'current') {
      return
    }
    setAccuracy(null)
    onChange(next === '' ? {} : { cityId: Number(next) })
  }

  function handleUseMyLocation() {
    const isCurrent = guard.start()
    setIsLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isCurrent()) {
          return
        }
        setIsLocating(false)
        setAccuracy(position.coords.accuracy)
        // AT-6: only the coordinates are kept; nothing is sent to a geocoding service.
        onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      },
      (positionError) => {
        if (!isCurrent()) {
          return
        }
        setIsLocating(false)
        setError(messageForPositionError(positionError.code))
      },
      // Ask for GPS on phones and a fresh position, not a cached one.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  const hintId = `${id}-hint`
  const shownError = error ?? serverError
  let hint: string | null = null
  if (shownError !== null) {
    hint = shownError
  } else if (citiesFailed) {
    hint = citiesUnavailableMessage(support)
  } else if (support === 'insecure' || support === 'unsupported') {
    hint = GEOLOCATION_MESSAGES[support]
  } else if (reused) {
    hint = 'Reusing the location of your last room. You can change it.'
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>Location (optional)</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id={id}
          name="location"
          value={selectValue}
          onChange={(event) => handleSelect(event.target.value)}
          aria-describedby={hint !== null ? hintId : undefined}
          aria-invalid={shownError !== null ? true : undefined}
          className={SELECT_CLASSES}
        >
          <option value="">No location</option>
          {hasCoordinates ? (
            <option value="current">
              {accuracy !== null
                ? `${CURRENT_LOCATION_LABEL} (${formatAccuracy(accuracy)})`
                : CURRENT_LOCATION_LABEL}
            </option>
          ) : null}
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={support !== 'available' || isLocating}
          aria-busy={isLocating}
        >
          {isLocating ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed aria-hidden="true" />
          )}
          Use my location
        </Button>
      </div>
      <div className="min-h-3.5">
        {hint !== null ? (
          <p
            id={hintId}
            role={shownError !== null ? 'alert' : citiesFailed ? 'status' : undefined}
            className={`text-[11px] leading-tight ${shownError !== null || citiesFailed ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
