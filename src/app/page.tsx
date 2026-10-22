export default function HomePage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-8">
      <header className="mb-6">
        <h1 className="m-0 text-[2rem]">FurniMi</h1>
        <p className="mt-1 mb-0">Plan your room before you buy.</p>
      </header>

      <main>
        <section aria-labelledby="create-room-heading" className="rounded-lg border p-6">
          <h2 id="create-room-heading" className="mt-0 text-xl">
            Create a room
          </h2>
          {/* ISS-5 replaces this placeholder with <CreateRoomForm /> */}
          <p className="italic">The create-room form will appear here.</p>
        </section>
      </main>
    </div>
  )
}
