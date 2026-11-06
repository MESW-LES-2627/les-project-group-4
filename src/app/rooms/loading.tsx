import { RoomsHeader } from '@/components/rooms/RoomsHeader'

/** Shown while the /rooms page loads the rooms on the server. */
export default function RoomsLoading() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-4xl content-start"
        aria-labelledby="rooms-heading"
        aria-busy="true"
      >
        <RoomsHeader />
        <p role="status" className="sr-only">
          Loading rooms…
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10"
            >
              <div className="aspect-3/2 animate-pulse border-b border-border bg-muted" />
              <div className="grid gap-2 p-3">
                <div className="h-3.5 w-2/3 animate-pulse rounded-sm bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded-sm bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
