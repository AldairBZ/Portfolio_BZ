import { expect, test, type Locator, type Page } from '@playwright/test'

// Todas las pruebas empiezan en español, sin depender del idioma del navegador
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('idioma')) localStorage.setItem('idioma', 'es')
  })
  await page.goto('/')
})

/** La caja de un elemento cuando lleva un momento sin moverse (scroll suave y animaciones) */
async function cajaQuieta(elemento: Locator) {
  let antes = await elemento.boundingBox()
  for (let i = 0; i < 40; i++) {
    await elemento.page().waitForTimeout(100)
    const ahora = await elemento.boundingBox()
    if (antes && ahora && Math.abs(antes.x - ahora.x) < 0.5 && Math.abs(antes.y - ahora.y) < 0.5 && Math.abs(antes.width - ahora.width) < 0.5) return ahora
    antes = ahora
  }
  throw new Error('el elemento no deja de moverse')
}

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
  // Carga el intérprete de COBOL y juega una mano entera: con el PC cargado necesita más margen
  test.slow()
  await abrirPaleta(page)
  await page.getByPlaceholder('Escribe un comando o un proyecto…').fill('cobol')
  await page.keyboard.press('Enter')

  const ventana = page.getByRole('dialog', { name: 'BlackJack en COBOL' })
  // Con muchas pruebas a la vez, cargar el intérprete puede tardar más de 5 segundos
  await expect(ventana).toBeVisible({ timeout: 15_000 })
  await expect(ventana.getByText('PON TU APUESTA')).toBeVisible({ timeout: 15_000 })

  await ventana.getByRole('button', { name: 'Apostar 25', exact: true }).click()
  await expect(ventana.getByText('APUESTA ACEPTADA')).toBeVisible()
  await ventana.getByRole('button', { name: 'Repartir' }).click()

  // Dos cartas para cada uno y el registro BRIDGE.DAT refleja el comando
  await expect(ventana.locator('.mano__cartas img')).toHaveCount(4)
  await expect(ventana.getByText(/START → [\d.,]+ instrucciones COBOL/)).toBeVisible()
  // Si sale un BlackJack natural (una mano de cada veinte), el COBOL paga al momento y la apuesta
  // vuelve a 0: la mano ya no está en juego y el mensaje lo dice
  const estado = ventana.locator('.cobol__campo', { hasText: 'WS-STATUS' })
  await expect(estado).not.toContainText('BETTING')
  if ((await estado.textContent())?.includes('PLAYING')) {
    await expect(ventana.locator('.cobol__campo', { hasText: 'WS-BET' })).toContainText('000025')
  } else {
    await expect(ventana.locator('.cobol__campo', { hasText: 'WS-MESSAGE' })).toContainText('BLACKJACK')
  }

  await page.keyboard.press('Escape')
  await expect(ventana).toBeHidden()
})

test('cambia a inglés y lo recuerda al recargar', async ({ page }) => {
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByText('Full Stack Developer · Tarragona, Spain')).toBeVisible()
  await expect(page).toHaveTitle(/Full Stack Developer/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.reload()
  await expect(page.getByText('Full Stack Developer · Tarragona, Spain')).toBeVisible()
})

test('se puede leer en catalán', async ({ page }) => {
  await page.getByRole('button', { name: 'Català' }).click()
  await expect(page.getByText('Desenvolupador Full Stack · Tarragona')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca')
  await expect(page).toHaveTitle(/Desenvolupador Full Stack/)
})

test.describe('con el navegador en catalán', () => {
  test.use({ locale: 'ca-ES' })

  test('detecta el idioma del navegador', async ({ browser }) => {
    const contexto = await browser.newContext({ locale: 'ca-ES' })
    const pagina = await contexto.newPage()
    await pagina.goto('/')
    await expect(pagina.locator('html')).toHaveAttribute('lang', 'ca')
    await expect(pagina.getByRole('button', { name: 'Català' })).toHaveAttribute('aria-pressed', 'true')
    await contexto.close()
  })
})

test('la paleta navega a una sección', async ({ page }) => {
  await abrirPaleta(page)
  await page.getByPlaceholder('Escribe un comando o un proyecto…').fill('contacto')
  // El primer resultado es «Ir a · Contacto»
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /Construimos/ })).toBeInViewport({ timeout: 5000 })
})

test('el retrato se dibuja y cada proyecto tiene su imagen', async ({ page }) => {
  await page.locator('.retrato').scrollIntoViewIfNeeded()
  await expect(page.getByRole('img', { name: /Retrato de Scheneider Baltazar/ })).toBeVisible()
  await expect(page.locator('.obra__lienzo')).toHaveCount(6)
})

test('la oreja del retrato abre el acceso al panel de visitas', async ({ page }) => {
  const retrato = page.locator('.retrato__lienzo')
  await retrato.scrollIntoViewIfNeeded()
  // El scroll es suave y la sección entra animada: se pulsa cuando el retrato ya no se mueve
  const caja = await cajaQuieta(retrato)
  await page.mouse.click(caja.x + caja.width * 0.665, caja.y + caja.height * 0.38)
  const panel = page.getByRole('dialog', { name: 'Panel de visitas' })
  await expect(panel.getByLabel('Contraseña')).toBeVisible()
  // Sin servidor de funciones la contraseña no se puede comprobar, pero el formulario responde
  await panel.getByLabel('Usuario').fill('nadie')
  await panel.getByLabel('Contraseña').fill('nada')
  await panel.getByRole('button', { name: 'Entrar' }).click()
  await expect(panel.locator('.panel__error')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})

test('el CV se descarga en el idioma elegido', async ({ page }) => {
  // Se pulsa cuando la portada ha terminado de entrar, como lo haría una persona: a mitad de la
  // animación, Playwright desplazaba la página para alcanzar el botón y la portada se iba.
  await expect(page.locator('.portada__acciones')).toHaveCSS('opacity', '1')
  const boton = await page.locator('.portada').getByRole('button', { name: 'Descargar CV' }).boundingBox()
  if (!boton) throw new Error('el botón no se ve')
  await page.mouse.click(boton.x + boton.width / 2, boton.y + boton.height / 2)
  const menu = page.getByRole('menu', { name: 'Idioma del CV' })
  await expect(menu.getByRole('menuitem')).toHaveText([/Castellano/, /Català/, /English/])
  // Clic de ratón en su sitio, con el menú ya quieto. El clic normal de Playwright a veces «acerca»
  // el elemento con el protocolo del navegador y, dentro de la escena sticky de la portada, eso
  // desplazaba la página y la portada se iba con el menú: una persona nunca hace eso.
  await expect(menu).toHaveCSS('transform', 'none')
  const caja = await menu.getByRole('menuitem', { name: /Català/ }).boundingBox()
  if (!caja) throw new Error('el menú no se ve')
  const descarga = page.waitForEvent('download')
  await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2)
  expect((await descarga).suggestedFilename()).toBe('Scheneider_Baltazar_CV_CA.pdf')
  await expect(menu).toBeHidden()
})
