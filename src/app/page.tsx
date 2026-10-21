export default function HomePage() {
  return (
    <div>
      <header>
        <h1>FurniMi</h1>
        <p>Plan your room before you buy.</p>
      </header>

      <main>
        <section aria-labelledby="create-room-heading">
          <h2 id="create-room-heading">Create a room</h2>
          {/* ISS-5 replaces this placeholder with <CreateRoomForm /> */}
          <p>The create-room form will appear here.</p>
        </section>
      </main>
    </div>
  )
}
