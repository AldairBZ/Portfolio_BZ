import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En Windows el vigilante de archivos a veces no detecta cambios: se comprueba por sondeo
    watch: { usePolling: true, interval: 300 },
  },
})
