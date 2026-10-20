import { TriangleAlert } from 'lucide-react'

interface FieldErrorProps {
  id: string
  message: string | undefined
}

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <div className="min-h-3.5">
      {message !== undefined ? (
        <p
          id={id}
          role="alert"
          className="flex items-start gap-1.5 text-[11px] leading-tight text-destructive"
        >
          <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  )
}
