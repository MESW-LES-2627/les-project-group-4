export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-8">
        <span className="text-lg font-bold tracking-tight text-foreground">
          FurniMi
          <span
            className="ml-1 inline-block size-1.5 -translate-y-1.5 rounded-xs bg-brand"
            aria-hidden="true"
          />
        </span>
      </div>
    </header>
  )
}
