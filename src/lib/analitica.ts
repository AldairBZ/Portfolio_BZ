/*
 * Contador de visitas anónimo. Cada pestaña recibe un número aleatorio de
 * sesión (sessionStorage, no cookies) para agrupar lo que se hace en una
 * visita. El servidor añade país, ciudad y red; nunca se guarda la IP.
 */

type Evento = 'visita' | 'ejecutar' | 'repo' | 'clic' | 'email' | 'linkedin' | 'github' | 'idioma' | 'seccion'

let sesion = ''

function idSesion() {
  if (sesion) return sesion
  try {
    sesion = sessionStorage.getItem('sesion') ?? ''
    if (!sesion) {
      sesion = crypto.randomUUID()
      sessionStorage.setItem('sesion', sesion)
    }
  } catch {
    sesion = sesion || crypto.randomUUID()
  }
  return sesion
}

// Mis enlaces de LinkedIn y GitHub llevan ?ref=…: se lee una vez y se quita de la dirección
const ref = new URLSearchParams(location.search).get('ref')
if (ref) {
  const limpia = new URL(location.href)
  limpia.searchParams.delete('ref')
  history.replaceState(history.state, '', limpia)
}

function origen() {
  return ref ? `ref:${ref}` : document.referrer
}

export function registrar(evento: Evento, detalle = '') {
  // Se respeta la preferencia de no ser rastreado del navegador
  if (navigator.doNotTrack === '1' || import.meta.env.DEV) return
  const cuerpo = JSON.stringify({
    sesion: idSesion(),
    evento,
    detalle,
    idioma: document.documentElement.lang,
    referencia: evento === 'visita' ? origen() : '',
  })
  try {
    const enviado = navigator.sendBeacon?.('/api/evento', new Blob([cuerpo], { type: 'application/json' }))
    if (!enviado) fetch('/api/evento', { method: 'POST', body: cuerpo, keepalive: true }).catch(() => {})
  } catch {
    // Si no se puede contar, la web sigue funcionando igual
  }
}

const REPO = /^https:\/\/github\.com\/AldairBZ\/([\w.-]+)/

/** Traduce un clic en un evento: repositorio, contacto o clic con su texto y su sección */
export function eventoDeClic(elemento: Element): [Evento, string] | null {
  const objetivo = elemento.closest('a, button')
  if (!objetivo || objetivo.closest('[data-sin-registro]')) return null
  const href = objetivo instanceof HTMLAnchorElement ? objetivo.href : ''
  const repo = href.match(REPO)
  if (repo) return ['repo', repo[1]]
  if (href.startsWith('mailto:')) return ['email', 'abrir']
  if (href.includes('linkedin.com')) return ['linkedin', '']
  if (/^https:\/\/github\.com\/AldairBZ\/?$/.test(href)) return ['github', '']

  const texto = (objetivo.getAttribute('aria-label') || objetivo.textContent || '').replace(/\s+/g, ' ').trim()
  const seccion = objetivo.closest('section[id], footer[id], header, [role="dialog"]')
  const donde = seccion?.id || seccion?.getAttribute('aria-label') || seccion?.tagName.toLowerCase() || ''
  return ['clic', `${donde ? `${donde}: ` : ''}${texto}`.slice(0, 80)]
}

/** Registra todos los clics de la página */
export function escucharClics() {
  const alClic = (e: MouseEvent) => {
    const evento = e.target instanceof Element ? eventoDeClic(e.target) : null
    if (evento) registrar(...evento)
  }
  document.addEventListener('click', alClic, { capture: true })
  return () => document.removeEventListener('click', alClic, { capture: true })
}
