import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const server = {
  host: '127.0.0.1',
  port: 5177,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8006',
      changeOrigin: true,
    },
    '/health': {
      target: 'http://127.0.0.1:8006',
      changeOrigin: true,
    },
    '/ready': {
      target: 'http://127.0.0.1:8006',
      changeOrigin: true,
    },
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server,
  preview: server,
})
