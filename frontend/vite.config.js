import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const backendPort = process.env.BACKEND_PORT || '3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
