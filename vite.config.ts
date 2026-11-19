/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import paquete from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // La versión de package.json se enseña en el pie de la web
  define: { __VERSION__: JSON.stringify(paquete.version) },
  server: {
    // En Windows el vigilante de archivos a veces no detecta cambios: se comprueba por sondeo
    watch: { usePolling: true, interval: 300 },
  },
  test: {
    // Las pruebas en navegador (e2e) las ejecuta Playwright, no Vitest
    include: ['src/**/*.test.ts', 'servidor/**/*.test.ts'],
  },
})
