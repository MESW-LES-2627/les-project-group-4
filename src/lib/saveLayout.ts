import type { CreateLayoutRequest } from '@/features/rooms/types'
import type { ApiError } from '@/lib/http'
import type { PlacedItem } from '@/features/plan/model/layout'
import { createLayoutSchema } from '@/lib/schemas/layout'
import { toFieldErrors } from '@/lib/validation'

export type SaveLayoutRequestResult =
  | { ok: true; request: CreateLayoutRequest }
  | { ok: false; nameError: string }

/**
 * US-13b AT-1 / AT-5: turns the form name and the plan items into the request body,
 * checked with the same schema as the API. A blank name returns an error and no request.
 */
export function toSaveLayoutRequest(
  name: string,
  items: readonly PlacedItem[],
): SaveLayoutRequestResult {
  const parsed = createLayoutSchema.safeParse({
    name,
    items: items.map(({ catalogItemId, xCm, yCm, rotationDeg }) => ({
      catalogItemId,
      xCm,
      yCm,
      rotationDeg,
    })),
  })
  if (parsed.success) {
    return { ok: true, request: parsed.data }
  }
  const errors = toFieldErrors(parsed.error)
  return { ok: false, nameError: errors.name ?? 'The layout could not be saved.' }
}

/**
 * US-13b AT-3 / AT-4: where to show a failed save. A rejected name (blank or duplicate)
 * goes next to the name field; anything else is a message for the whole form.
 */
export function describeSaveError(error: ApiError): { nameError?: string; formError?: string } {
  const nameError = error.fieldErrors.name
  if (nameError !== undefined) {
    return { nameError }
  }
  return { formError: error.message }
}
