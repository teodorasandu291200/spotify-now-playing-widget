import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      'localhost',
      '7f0b-81-96-177-149.ngrok-free.app' // Add your ngrok host here
    ]
  }
})
