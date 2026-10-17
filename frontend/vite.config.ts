import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Reads frontend/.env, .env.local, .env.[mode] ... ('' = load all keys, not only VITE_*).
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_URL || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // In development, the browser calls http://localhost:5173/api/...
        // and Vite forwards it to the backend, so there is no CORS issue.
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})

