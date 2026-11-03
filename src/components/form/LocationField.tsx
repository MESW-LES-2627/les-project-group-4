'use client'

import { useState, useSyncExternalStore } from 'react'
import { LoaderCircle, LocateFixed } from 'lucide-react'

import type { City } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CURRENT_LOCATION_LABEL } from '@/lib/location'
import type { RoomLocationInput } from '@/lib/roomValidation'

// AT-3 and AT-4: when the browser cannot give a location, say why and point to the city list.
const MESSAGES = {
  insecure: 'Your location needs a secure (HTTPS) connection. Choose a city instead.',
  unsupported: 'This browser cannot share your location. Choose a city instead.',
  denied: 'Location permission was denied. Choose a city instead, or allow location in your browser settings.',
  failed: 'Could not get your location. Choose a city instead.',
} as const

type GeolocationSupport = 'available' | 'insecure' | 'unsupported'

/** Geolocation only works in a secure context (HTTPS or localhost). */
function getGeolocationSupport(): GeolocationSupport {
  if (!window.isSecureContext) {
    return 'insecure'
  }
  return 'geolocation' in navigator ? 'available' : 'unsupported'
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
}

/** US-15: pick a seeded city, or use the browser's coordinates (no reverse geocoding). */
export function LocationField({ id, cities, value, onChange }: LocationFieldProps) {
  const support = useSyncExternalStore(subscribe, getGeolocationSupport, getServerSupport)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasCoordinates = value.latitude !== undefined && value.longitude !== undefined
  let selectValue = ''
  if (value.cityId !== undefined) {
    selectValue = String(value.cityId)
  } else if (hasCoordinates) {
    selectValue = 'current'
  }

  function handleSelect(next: string) {
    setError(null)
    if (next === 'current') {
      return
    }
    onChange(next === '' ? {} : { cityId: Number(next) })
  }

  function handleUseMyLocation() {
    setIsLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        // AT-6: only the coordinates are kept; nothing is sent to a geocoding service.
        onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      },
      (positionError) => {
        setIsLocating(false)
        setError(
          positionError.code === positionError.PERMISSION_DENIED ? MESSAGES.denied : MESSAGES.failed,
        )
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const hintId = `${id}-hint`
  let hint: string | null = null
  if (error !== null) {
    hint = error
  } else if (support === 'insecure' || support === 'unsupported') {
    hint = MESSAGES[support]
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
          className={SELECT_CLASSES}
        >
          <option value="">No location</option>
          {hasCoordinates ? <option value="current">{CURRENT_LOCATION_LABEL}</option> : null}
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
            role={error !== null ? 'alert' : undefined}
            className={`text-[11px] leading-tight ${error !== null ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
