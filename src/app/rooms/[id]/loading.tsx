import { LoaderCircle } from 'lucide-react'

/** Shown while /rooms/[id] loads the room on the server (replaces the list's loading.tsx here). */
export default function RoomLoading() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-2xl content-start gap-6">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading room…
        </p>
      </section>
    </main>
  )
}
