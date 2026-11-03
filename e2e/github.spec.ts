import { expect, test } from '@playwright/test'

// La respuesta del Worker se simula para no depender de la API de GitHub
const hoy = new Date('2026-11-03T12:00:00Z')
const dias = Array.from({ length: 371 }, (_, i) => {
  const fecha = new Date(hoy.getTime() - (370 - i) * 86400000)
  return { fecha: fecha.toISOString().slice(0, 10), nivel: (i * 7) % 5 }
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('idioma', 'es'))
  await page.route('**/api/github', (ruta) =>
    ruta.fulfill({
      json: {
        repos: [
          { name: 'TetrisGame', language: 'Java', pushed_at: hoy.toISOString(), html_url: 'https://github.com/AldairBZ/TetrisGame', description: '' },
          { name: 'LifeLevelUp', language: 'JavaScript', pushed_at: hoy.toISOString(), html_url: 'https://github.com/AldairBZ/LifeLevelUp', description: '' },
        ],
        commits: [
          { repo: 'TetrisGame', mensaje: 'Añade tests del tablero', fecha: hoy.toISOString(), url: 'https://github.com/AldairBZ/TetrisGame/commit/1' },
        ],
        actividad: { dias, total: 312 },
        generado: hoy.toISOString(),
      },
    }),
  )
  await page.goto('/')
})

test('la sección de GitHub muestra commits, lenguajes y el mapa de actividad', async ({ page }) => {
  const seccion = page.locator('.github')
  await seccion.scrollIntoViewIfNeeded()
  await expect(seccion.getByText('Añade tests del tablero')).toBeVisible()
  await expect(seccion.getByText('312 contribuciones en el último año')).toBeVisible()
  await expect(seccion.locator('.actividad__dia--4').first()).toBeVisible()
  await expect(seccion.getByRole('img', { name: 'Mapa de contribuciones de GitHub' })).toBeVisible()
  await seccion.screenshot({ path: 'test-results/github.png' })
})
