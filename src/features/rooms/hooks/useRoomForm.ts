import { useRef, useState } from 'react'
import type { Ref, SubmitEvent } from 'react'

import { isFormValid, validateForm } from '../model/roomValidation'
import type {
  RoomFormErrors,
  RoomFormField,
  RoomFormValues,
} from '../model/roomValidation'

const FIELD_ORDER: readonly RoomFormField[] = ['name', 'width', 'length']

const EMPTY_VALUES: RoomFormValues = {
  name: '',
  width: '',
  length: '',
}

type TouchedFields = Partial<Record<RoomFormField, boolean>>

export interface RoomFormFieldProps {
  id: string
  value: string
  error: string | undefined
  onValueChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
}

/** US-01; US-04 passes the room's current values so the edit form starts pre-filled. */
export function useRoomForm(initialValues: RoomFormValues = EMPTY_VALUES) {
  const [values, setValues] = useState<RoomFormValues>(initialValues)
  const [touched, setTouched] = useState<TouchedFields>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<RoomFormErrors>({})

  const nameRef = useRef<HTMLInputElement>(null)
  const widthRef = useRef<HTMLInputElement>(null)
  const lengthRef = useRef<HTMLInputElement>(null)
  const inputRefs = { name: nameRef, width: widthRef, length: lengthRef }

  const clientErrors = validateForm(values)
  const errors: RoomFormErrors = { ...serverErrors, ...clientErrors }

  function handleChange(field: RoomFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setServerErrors((current) => {
      if (current[field] === undefined) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function handleBlur(field: RoomFormField) {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  function showError(field: RoomFormField): string | undefined {
    return touched[field] === true || submitted ? errors[field] : undefined
  }

  function focusField(field: RoomFormField) {
    inputRefs[field].current?.focus()
  }

  function getFieldProps(field: RoomFormField): RoomFormFieldProps {
    return {
      id: `room-${field}`,
      value: values[field],
      error: showError(field),
      onValueChange: (value) => handleChange(field, value),
      onBlur: () => handleBlur(field),
      inputRef: inputRefs[field],
    }
  }

  function handleSubmit(
    onValid: (values: RoomFormValues) => void | Promise<void>,
  ): (event: SubmitEvent<HTMLFormElement>) => void {
    return (event) => {
      event.preventDefault()
      setSubmitted(true)

      const currentErrors = validateForm(values)

      if (!isFormValid(currentErrors)) {
        const firstInvalid = FIELD_ORDER.find(
          (field) => currentErrors[field] !== undefined,
        )
        if (firstInvalid !== undefined) {
          focusField(firstInvalid)
        }
        return
      }

      setServerErrors({})
      void onValid(values)
    }
  }

  function applyServerErrors(nextErrors: RoomFormErrors) {
    setSubmitted(true)
    setServerErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find(
      (field) => nextErrors[field] !== undefined,
    )
    if (firstInvalid !== undefined) {
      focusField(firstInvalid)
    }
  }

  function reset() {
    setValues(initialValues)
    setTouched({})
    setSubmitted(false)
    setServerErrors({})
  }

  return {
    getFieldProps,
    handleSubmit,
    applyServerErrors,
    reset,
  }
}
