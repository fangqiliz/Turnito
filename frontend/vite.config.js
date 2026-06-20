import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/businesses': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/employees': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/services': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/schedules': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/appointments': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
