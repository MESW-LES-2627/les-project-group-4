import { LoaderCircle } from 'lucide-react'

/** Shown while the /rooms page loads the rooms on the server. */
export default function RoomsLoading() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-2xl content-start gap-6"
        aria-labelledby="rooms-heading"
      >
        <h1 id="rooms-heading" className="text-2xl font-bold tracking-tight text-foreground">
          My rooms
        </h1>
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading rooms…
        </p>
      </section>
    </main>
  )
}
