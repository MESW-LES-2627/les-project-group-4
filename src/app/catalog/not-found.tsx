import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/** Shown by /catalog when ?category= is not one of the known categories. */
export default function CatalogNotFound() {
  return (
    <main className="flex flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto grid w-full max-w-5xl content-start justify-items-start gap-4">
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>
            <h1>Category not found</h1>
          </AlertTitle>
          <AlertDescription>
            There is no catalog category at this address. The link may be wrong.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/catalog">Show all items</Link>
        </Button>
      </section>
    </main>
  )
}
