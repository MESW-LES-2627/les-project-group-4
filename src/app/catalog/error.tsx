'use client' // Error boundaries must be Client Components

import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/** Shown when the /catalog page fails to load the items (e.g. the database is down). */
export default function CatalogError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-5xl content-start gap-6"
        aria-labelledby="catalog-heading"
      >
        <h1 id="catalog-heading" className="text-2xl font-bold tracking-tight text-foreground">
          Catalog
        </h1>
        <div className="grid justify-items-start gap-4">
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Could not load the catalog</AlertTitle>
            <AlertDescription>
              The server is unavailable right now. Please try again later.
            </AlertDescription>
          </Alert>
          {/* retry() renders the page again on the server, so the items are loaded again. */}
          <Button type="button" variant="outline" onClick={() => retry()}>
            Try again
          </Button>
        </div>
      </section>
    </main>
  )
}