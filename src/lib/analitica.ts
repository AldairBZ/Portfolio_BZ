/*
 * Contador de visitas anónimo. Cada pestaña recibe un número aleatorio de
 * sesión (sessionStorage, no cookies) para agrupar lo que se hace en una
 * visita. El Worker añade país, ciudad y red; nunca se guarda la IP.
 */

type Evento = 'visita' | 'ejecutar' | 'email' | 'linkedin' | 'github' | 'idioma' | 'seccion'

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

export function registrar(evento: Evento, detalle = '') {
  // Se respeta la preferencia de no ser rastreado del navegador
  if (navigator.doNotTrack === '1' || import.meta.env.DEV) return
  const cuerpo = JSON.stringify({
    sesion: idSesion(),
    evento,
    detalle,
    idioma: document.documentElement.lang,
    referencia: evento === 'visita' ? document.referrer : '',
  })
  try {
    const enviado = navigator.sendBeacon?.('/api/visita', new Blob([cuerpo], { type: 'application/json' }))
    if (!enviado) fetch('/api/visita', { method: 'POST', body: cuerpo, keepalive: true }).catch(() => {})
  } catch {
    // Si no se puede contar la visita, la web sigue funcionando igual
  }
}
