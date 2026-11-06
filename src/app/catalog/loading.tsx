import { LoaderCircle } from 'lucide-react'

/** Shown while the /catalog page loads the items on the server. */
export default function CatalogLoading() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section
        className="mx-auto grid w-full max-w-5xl content-start gap-6"
        aria-labelledby="catalog-heading"
      >
        <h1 id="catalog-heading" className="text-2xl font-bold tracking-tight text-foreground">
          Catalog
        </h1>
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading items…
        </p>
      </section>
    </main>
  )
}