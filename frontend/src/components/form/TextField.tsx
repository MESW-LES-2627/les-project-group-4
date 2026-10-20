import type { ComponentProps, Ref } from 'react'

import { FieldError } from '@/components/form/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type NativeInputProps = Omit<
  ComponentProps<typeof Input>,
  | 'id'
  | 'value'
  | 'onChange'
  | 'onBlur'
  | 'ref'
  | 'aria-invalid'
  | 'aria-describedby'
>

interface TextFieldProps extends NativeInputProps {
  id: string
  label: string
  value: string
  error?: string
  onValueChange: (value: string) => void
  onBlur: () => void
  inputRef?: Ref<HTMLInputElement>
}

export function TextField({
  id,
  label,
  value,
  error,
  onValueChange,
  onBlur,
  inputRef,
  ...inputProps
}: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...inputProps}
        id={id}
        ref={inputRef}
        value={value}
        aria-invalid={error !== undefined ? true : undefined}
        aria-describedby={error !== undefined ? errorId : undefined}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={onBlur}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
