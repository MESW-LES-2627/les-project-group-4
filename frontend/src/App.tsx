import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">FurniMi</h1>
        <p className="app-tagline">Plan your room before you buy.</p>
      </header>

      <main className="app-main">
        <section className="panel" aria-labelledby="create-room-heading">
          <h2 id="create-room-heading">Create a room</h2>
          {/* ISS-5 replaces this placeholder with <CreateRoomForm /> */}
          <p className="placeholder">The create-room form will appear here.</p>
        </section>
      </main>
    </div>
  )
}

export default App
