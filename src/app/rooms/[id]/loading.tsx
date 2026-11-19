import { LoaderCircle } from 'lucide-react'

/** Shown while /rooms/[id] loads the room on the server (replaces the list's loading.tsx here). */
export default function RoomLoading() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-7xl content-start gap-6">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading room…
        </p>

        <div className="grid gap-6" aria-hidden="true">
          <div className="grid gap-2">
            <div className="h-8 w-64 max-w-full animate-pulse rounded-sm bg-muted" />
            <div className="h-4 w-48 max-w-full animate-pulse rounded-sm bg-muted" />
          </div>

          <div className="grid gap-6 lg:h-[30rem] lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_16rem] xl:h-[34rem] xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
            <div className="h-64 animate-pulse rounded-lg border border-border bg-muted lg:h-full" />
            <div className="h-80 animate-pulse rounded-lg border border-border bg-muted sm:h-105 lg:h-full" />
            <div className="h-64 animate-pulse rounded-lg border border-border bg-muted lg:h-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <div className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
            <div className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
            <div className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
          </div>
        </div>
      </section>
    </main>
  )
}
