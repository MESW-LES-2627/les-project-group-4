import type { RoomLocationInput } from '@/features/locations/schema'

import type { CreateRoomRequest } from '../types'

// Client-side rules for the create-room form

export const NAME_MAX_LENGTH = 255

// The database stores dimensions as a 32-bit int, so anything above this would
// overflow when the JSON body is deserialised.
export const MAX_DIMENSION_CM = 2_147_483_647

export type RoomFormField = 'name' | 'width' | 'length'

export type RoomFormValues = Record<RoomFormField, string>

export type RoomFormErrors = Partial<Record<RoomFormField, string>>

const FORM_FIELDS: readonly RoomFormField[] = ['name', 'width', 'length']

const FIELD_LABELS: Record<RoomFormField, string> = {
  name: 'Name',
  width: 'Width',
  length: 'Length',
}

// Server field names come from the frozen API contract and must stay in sync
// with CreateRoomRequest.
const SERVER_FIELD_NAMES: Record<string, RoomFormField> = {
  name: 'name',
  widthCm: 'width',
  lengthCm: 'length',
}

const WHOLE_NUMBER_PATTERN = /^\d+$/

/** Validates a room name. Returns an error message, or undefined when valid. */
export function validateName(value: string): string | undefined {
  const name = value.trim()

  if (name === '') {
    return 'Name is required'
  }
  if (name.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters`
  }
  return undefined
}

/**
 * Validates one dimension in centimetres.
 * `label` is the user-facing field name, e.g. "Width"
 */
export function validateDimension(
  value: string,
  label: string,
): string | undefined {
  const dimension = value.trim()

  if (dimension === '') {
    return `${label} is required`
  }
  if (!WHOLE_NUMBER_PATTERN.test(dimension)) {
    return `${label} must be a positive whole number`
  }

  const centimetres = Number(dimension)

  if (centimetres <= 0) {
    return `${label} must be greater than 0`
  }
  if (centimetres > MAX_DIMENSION_CM) {
    return `${label} is too large`
  }
  return undefined
}

/** Validates a single form field. Returns an error message, or undefined. */
export function validateField(
  field: RoomFormField,
  value: string,
): string | undefined {
  if (field === 'name') {
    return validateName(value)
  }
  return validateDimension(value, FIELD_LABELS[field])
}

/** Validates every field and returns only the fields that have errors. */
export function validateForm(values: RoomFormValues): RoomFormErrors {
  const errors: RoomFormErrors = {}

  for (const field of FORM_FIELDS) {
    const message = validateField(field, values[field])
    if (message !== undefined) {
      errors[field] = message
    }
  }
  return errors
}

/** True when a form-error object contains no field errors. */
export function isFormValid(errors: RoomFormErrors): boolean {
  return Object.keys(errors).length === 0
}

/**
 * Converts validated form values (and the optional US-15 location) into the API request body
 * Returns null when the values would fail validation
 */
export function toCreateRoomRequest(
  values: RoomFormValues,
  location: RoomLocationInput = {},
): CreateRoomRequest | null {
  if (!isFormValid(validateForm(values))) {
    return null
  }

  return {
    name: values.name.trim(),
    widthCm: Number(values.width.trim()),
    lengthCm: Number(values.length.trim()),
    ...location,
  }
}

/**
 * Maps the backend's { errors: { widthCm: "..." } } body onto form fields
 * Unknown server fields are ignored
 */
export function mapServerFieldErrors(
  fieldErrors: Record<string, string>,
): RoomFormErrors {
  const errors: RoomFormErrors = {}

  for (const [serverField, message] of Object.entries(fieldErrors)) {
    const field = SERVER_FIELD_NAMES[serverField]
    if (field !== undefined && message.trim() !== '') {
      errors[field] = message
    }
  }
  return errors
}

/**
 * US-15: the server's location errors (cityId, latitude, longitude) as one sentence for the
 * location field, or undefined when there are none. They are not form fields, so
 * mapServerFieldErrors leaves them out and they would otherwise be lost.
 */
export function pickLocationError(fieldErrors: Record<string, string>): string | undefined {
  const cityError = fieldErrors.cityId?.trim()
  if (cityError === 'does not exist') {
    return 'That city is no longer available. Choose another location.'
  }
  if (cityError) {
    return `Location: ${cityError}.`
  }
  if (fieldErrors.latitude?.trim() || fieldErrors.longitude?.trim()) {
    return 'Your current location could not be saved. Try "Use my location" again or choose a city.'
  }
  return undefined
}
