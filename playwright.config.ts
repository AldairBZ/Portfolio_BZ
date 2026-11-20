import { defineConfig, devices } from '@playwright/test'

// Las pruebas se ejecutan contra la versión compilada, como la verá la gente
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  // Cada prueba anima el planeta a 60 fps: con un navegador por núcleo el PC se ahoga y todo va lento
  workers: process.env.CI ? 2 : 4,
  // Con varios navegadores animando a la vez, 5 segundos a veces no llegan para que algo aparezca
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
