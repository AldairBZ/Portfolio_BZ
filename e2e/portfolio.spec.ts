import { expect, test, type Page } from '@playwright/test'

// Todas las pruebas empiezan en español, sin depender del idioma del navegador
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('idioma')) localStorage.setItem('idioma', 'es')
  })
  await page.goto('/')
})

const esMovil = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

async function abrirPaleta(page: Page) {
  if (esMovil(page)) await page.getByRole('button', { name: 'Abrir paleta de comandos' }).click()
  else await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog', { name: 'Paleta de comandos' })).toBeVisible()
}

test('la portada presenta al desarrollador', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Scheneider')
  await expect(page.getByText('Desarrollador Full Stack · Tarragona')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver proyectos' })).toBeVisible()
})

test('ninguna sección provoca scroll horizontal', async ({ page }) => {
  for (const seccion of ['#proyectos', '#trayectoria', '#contacto']) {
    await page.locator(seccion).scrollIntoViewIfNeeded()
    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(desborde, `desbordamiento en ${seccion}`).toBeLessThanOrEqual(0)
  }
})

test('se juega una mano de BlackJack con el motor COBOL', async ({ page }) => {
  await abrirPaleta(page)
  await page.getByPlaceholder('Escribe un comando o un proyecto…').fill('cobol')
  await page.keyboard.press('Enter')

  const ventana = page.getByRole('dialog', { name: 'BlackJack en COBOL' })
  await expect(ventana).toBeVisible()
  await expect(ventana.getByText('PON TU APUESTA')).toBeVisible()

  await ventana.getByRole('button', { name: 'Apostar 25', exact: true }).click()
  await expect(ventana.getByText('APUESTA ACEPTADA')).toBeVisible()
  await ventana.getByRole('button', { name: 'Repartir' }).click()

  // Dos cartas para cada uno y el registro BRIDGE.DAT refleja el comando
  await expect(ventana.locator('.mano__cartas img')).toHaveCount(4)
  await expect(ventana.getByText(/START → [\d.,]+ instrucciones COBOL/)).toBeVisible()
  await expect(ventana.locator('.cobol__campo', { hasText: 'WS-BET' })).toContainText('000025')

  await page.keyboard.press('Escape')
  await expect(ventana).toBeHidden()
})

test('cambia a inglés y lo recuerda al recargar', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.getByText('Full Stack Developer · Tarragona, Spain')).toBeVisible()
  await expect(page).toHaveTitle(/Full Stack Developer/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.reload()
  await expect(page.getByText('Full Stack Developer · Tarragona, Spain')).toBeVisible()
})

test('la paleta navega a una sección', async ({ page }) => {
  await abrirPaleta(page)
  await page.getByPlaceholder('Escribe un comando o un proyecto…').fill('contacto')
  // El primer resultado es «Ir a · Contacto»
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /Construimos/ })).toBeInViewport({ timeout: 5000 })
})

test('el retrato y la ilustración de cada proyecto se dibujan en canvas', async ({ page }) => {
  await page.locator('.retrato').scrollIntoViewIfNeeded()
  await expect(page.getByRole('img', { name: /Retrato de Scheneider Baltazar/ })).toBeVisible()
  await expect(page.locator('.obra__lienzo')).toHaveCount(6)
})
