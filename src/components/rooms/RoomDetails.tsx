import type { Room } from '@/api/types'
import { RoomPlan } from '@/components/plan/RoomPlan'

/** US-03: one room's details, including the 2D plan. */
export function RoomDetails({ room }: { room: Room }) {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight wrap-break-word text-foreground">
        {room.name}
      </h1>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Width</dt>
          <dd className="font-medium text-foreground">{room.widthCm} cm</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Length</dt>
          <dd className="font-medium text-foreground">{room.lengthCm} cm</dd>
        </div>
      </dl>

      <section aria-labelledby="plan-heading">
        <RoomPlan room={room} />
      </section>
    </div>
  )
}
