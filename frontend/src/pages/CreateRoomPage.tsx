import { CreateRoomForm } from '@/components/CreateRoomForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function CreateRoomPage() {
  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="w-full max-w-lg"
        aria-labelledby="create-room-heading"
      >
        <Card className="gap-0 py-6">
          <CardHeader className="gap-2 px-6 pb-5">
            <h1
              id="create-room-heading"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Create a room
            </h1>
            <p className="text-sm text-muted-foreground">
              Add a room's name and its real dimensions so FurniMi can check
              what fits.
            </p>
          </CardHeader>
          <CardContent className="px-6">
            <CreateRoomForm />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
