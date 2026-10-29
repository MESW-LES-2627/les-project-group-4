import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          FurniMi
          <span
            className="ml-1 inline-block size-1.5 -translate-y-1.5 rounded-xs bg-brand"
            aria-hidden="true"
          />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            New room
          </Link>
          <Link href="/rooms" className="text-muted-foreground hover:text-foreground">
            My rooms
          </Link>
        </nav>
      </div>
    </header>
  )
}
