import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendHost = env.VITE_HOST || '0.0.0.0'
  const frontendPort = Number(env.VITE_PORT || 5173)
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5003'

  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    server: {
      host: frontendHost,
      port: frontendPort,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: frontendHost,
      port: frontendPort,
    },
  }
})
