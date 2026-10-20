import { AppHeader } from '@/components/layout/AppHeader'
import { CreateRoomPage } from '@/pages/CreateRoomPage'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <CreateRoomPage />
    </div>
  )
}

export default App
