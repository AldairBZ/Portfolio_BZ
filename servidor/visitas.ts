/*
 * Contador de visitas propio y anónimo. Guarda qué se hace en la web (visita,
 * proyecto ejecutado, repositorio abierto, cada clic…) con los datos
 * aproximados que da Cloudflare: país, ciudad y la red desde la que se conecta.
 * No guarda IP ni usa cookies. El panel solo responde con el usuario y la clave
 * guardados como secretos (PANEL_USUARIO y PANEL_CLAVE), nunca en el código.
 */

import { DIAS, EVENTOS, iguales, resumir, type Evento, type Fila } from './resumen'

export interface Entorno {
  DB?: D1Database
  PANEL_USUARIO?: string
  PANEL_CLAVE?: string
  GITHUB_TOKEN?: string
}

export async function registrarEvento(request: Request, env: Entorno) {
  if (!env.DB) return new Response(null, { status: 204 })
  let datos: { sesion?: string; evento?: string; detalle?: string; idioma?: string; referencia?: string }
  try {
    datos = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!datos.sesion || !EVENTOS.includes(datos.evento as Evento)) return new Response(null, { status: 400 })

  const agente = request.headers.get('User-Agent') ?? ''
  // Los robots (buscadores, vistas previas de enlaces) no cuentan
  if (/bot|crawler|spider|preview|headless|lighthouse/i.test(agente)) return new Response(null, { status: 204 })
  const cf = (request.cf ?? {}) as { country?: string; city?: string; asOrganization?: string }
  let referencia = ''
  try {
    referencia = datos.referencia ? new URL(datos.referencia).hostname.replace(/^www\./, '') : ''
  } catch {
    referencia = ''
  }

  await env.DB.prepare(
    `INSERT INTO eventos (fecha, sesion, evento, detalle, idioma, referencia, pais, ciudad, red, dispositivo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      new Date().toISOString(),
      datos.sesion.slice(0, 40),
      datos.evento,
      (datos.detalle ?? '').slice(0, 80),
      (datos.idioma ?? '').slice(0, 5),
      referencia.slice(0, 80),
      cf.country ?? '',
      cf.city ?? '',
      (cf.asOrganization ?? '').slice(0, 80),
      /Mobi|Android|iPhone|iPad/i.test(agente) ? 'móvil' : 'ordenador',
    )
    .run()
  return new Response(null, { status: 204 })
}

export async function responderPanel(request: Request, env: Entorno) {
  let datos: { usuario?: string; clave?: string }
  try {
    datos = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  // Las dos comparaciones se hacen siempre, aunque falle la primera
  const usuarioBien = iguales(datos.usuario ?? '', env.PANEL_USUARIO ?? '')
  const claveBien = iguales(datos.clave ?? '', env.PANEL_CLAVE ?? '')
  const valido = Boolean(env.PANEL_USUARIO && env.PANEL_CLAVE) && usuarioBien && claveBien
  if (!valido || !env.DB) {
    // Un fallo tarda un poco: probar claves a ciegas sale caro
    await new Promise((r) => setTimeout(r, 900))
    return Response.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }

  const desde = new Date(Date.now() - DIAS * 86400000).toISOString()
  const { results } = await env.DB.prepare('SELECT * FROM eventos WHERE fecha >= ? ORDER BY fecha DESC LIMIT 20000')
    .bind(desde)
    .all<Fila>()
  return Response.json(resumir(results), { headers: { 'Cache-Control': 'no-store' } })
}
