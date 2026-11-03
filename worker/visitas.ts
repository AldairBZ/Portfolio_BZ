/*
 * Contador de visitas propio y anónimo. Guarda qué se hace en la web
 * (visita, proyecto ejecutado, email copiado…) con datos aproximados que da
 * Cloudflare: país, ciudad y la red desde la que se conecta. No guarda IP
 * ni usa cookies. El panel solo se abre con la clave secreta PANEL_CLAVE.
 */

export interface Entorno {
  ASSETS: Fetcher
  DB?: D1Database
  PANEL_CLAVE?: string
  GITHUB_TOKEN?: string
}

const EVENTOS = new Set(['visita', 'ejecutar', 'email', 'linkedin', 'github', 'idioma', 'seccion'])

// Webs de empleo: si alguien llega desde aquí, probablemente busca candidatos
const PORTALES_EMPLEO = /linkedin|lnkd|infojobs|indeed|glassdoor|tecnoempleo|computrabajo|welcometothejungle|jobs|joinrs|manfred|getmanfred|wellfound/i
// Operadores domésticos: desde estas redes no se puede saber la empresa
const OPERADORES = /telef[oó]nica|movistar|vodafone|orange|digi|m[aá]sm[oó]vil|jazztel|yoigo|pepephone|lowi|euskaltel|r cable|telecable|avatel|adamo|o2|simyo|finetwork|starlink|google fiber|comcast|verizon|at&t|t-mobile|free sas|sfr|bouygues|tim |wind|fastweb|claro|tigo|movil|mobile|cellular|wireless|broadband|internet service|isp|telecom|cable/i

export async function registrarEvento(request: Request, env: Entorno) {
  if (!env.DB) return new Response(null, { status: 204 })
  let datos: { sesion?: string; evento?: string; detalle?: string; idioma?: string; referencia?: string }
  try {
    datos = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  if (!datos.sesion || !datos.evento || !EVENTOS.has(datos.evento)) return new Response(null, { status: 400 })

  const cf = (request.cf ?? {}) as { country?: string; city?: string; asOrganization?: string }
  const agente = request.headers.get('User-Agent') ?? ''
  // Los robots (buscadores, vistas previas de enlaces) no cuentan como visitas
  if (/bot|crawler|spider|preview|headless|lighthouse/i.test(agente)) return new Response(null, { status: 204 })
  const dispositivo = /Mobi|Android|iPhone|iPad/i.test(agente) ? 'móvil' : 'ordenador'
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
      dispositivo,
    )
    .run()
  return new Response(null, { status: 204 })
}

/** Compara la clave en tiempo constante para no dar pistas por el tiempo de respuesta */
function claveCorrecta(recibida: string, esperada: string) {
  const a = new TextEncoder().encode(recibida)
  const b = new TextEncoder().encode(esperada)
  let diferencia = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diferencia |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diferencia === 0
}

interface Fila {
  fecha: string
  sesion: string
  evento: string
  detalle: string
  idioma: string
  referencia: string
  pais: string
  ciudad: string
  red: string
  dispositivo: string
}

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const barra = (n: number, max: number) => '█'.repeat(Math.round((n / Math.max(max, 1)) * 24)).padEnd(24, '·')

export async function mostrarPanel(request: Request, env: Entorno) {
  const clave = new URL(request.url).searchParams.get('clave') ?? ''
  if (!env.PANEL_CLAVE || !env.DB || !claveCorrecta(clave, env.PANEL_CLAVE)) {
    return new Response('No encontrado', { status: 404 })
  }

  const desde = new Date(Date.now() - 30 * 86400000).toISOString()
  const { results } = await env.DB.prepare('SELECT * FROM eventos WHERE fecha >= ? ORDER BY fecha DESC LIMIT 5000')
    .bind(desde)
    .all<Fila>()

  // Agrupa los eventos por sesión: una sesión es una visita
  const sesiones = new Map<string, Fila[]>()
  for (const f of results) sesiones.set(f.sesion, [...(sesiones.get(f.sesion) ?? []), f])
  const visitas = [...sesiones.values()].map((eventos) => {
    const primera = eventos[eventos.length - 1]
    const acciones = eventos.filter((e) => e.evento !== 'visita')
    const portal = PORTALES_EMPLEO.test(primera.referencia)
    const empresa = primera.red && !OPERADORES.test(primera.red)
    return { primera, acciones, portal, empresa, interesante: portal || empresa || acciones.some((a) => a.evento === 'email' || a.evento === 'linkedin') }
  })

  const contar = (valores: string[]) => {
    const m = new Map<string, number>()
    for (const v of valores) if (v) m.set(v, (m.get(v) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }
  const porDia = contar(visitas.map((v) => v.primera.fecha.slice(0, 10))).sort((a, b) => a[0].localeCompare(b[0]))
  const referencias = contar(visitas.map((v) => v.primera.referencia || 'directo'))
  const lugares = contar(visitas.map((v) => [v.primera.ciudad, v.primera.pais].filter(Boolean).join(', ')))
  const proyectos = contar(results.filter((f) => f.evento === 'ejecutar').map((f) => f.detalle))
  const maxDia = Math.max(...porDia.map((d) => d[1]), 1)

  const tabla = (titulo: string, filas: [string, number][]) => `
    <section><h2>${titulo}</h2><pre>${
      filas.length
        ? filas.map(([k, n]) => `${escapar(k).padEnd(28).slice(0, 28)} ${barra(n, filas[0][1])} ${n}`).join('\n')
        : 'Sin datos todavía'
    }</pre></section>`

  const filasVisitas = visitas
    .slice(0, 80)
    .map(({ primera: p, acciones, portal, empresa, interesante }) => {
      const etiquetas = [
        portal ? '<b class="r">viene de un portal de empleo</b>' : '',
        empresa ? `<b class="e">red de empresa: ${escapar(p.red)}</b>` : '',
      ].join(' ')
      const hechos = acciones.map((a) => `<span>${escapar(a.evento)}${a.detalle ? `:${escapar(a.detalle)}` : ''}</span>`).join(' ')
      return `<tr class="${interesante ? 'destacada' : ''}">
        <td>${escapar(new Date(p.fecha).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }))}</td>
        <td>${escapar([p.ciudad, p.pais].filter(Boolean).join(', ') || '—')}</td>
        <td>${escapar(p.referencia || 'directo')}</td>
        <td>${escapar(p.dispositivo)} · ${escapar(p.idioma)}</td>
        <td>${etiquetas} ${hechos}</td>
      </tr>`
    })
    .join('')

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex"><title>Panel de visitas</title>
  <style>
    body{margin:0;padding:2rem 1rem;background:#0e0d0b;color:#efe8da;font:14px/1.5 ui-monospace,monospace}
    main{max-width:1100px;margin:auto} h1{font-size:2rem;margin:0 0 .25rem} p{color:#b8ae9c;margin:0 0 2rem}
    .cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;margin-bottom:2rem}
    .cifras div{border:1px solid #2c2922;border-radius:10px;padding:1rem} .cifras strong{display:block;font-size:2rem;color:#d6502e}
    section{margin-bottom:2rem} h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:#7d7566}
    pre{margin:0;overflow-x:auto;color:#b8ae9c} table{width:100%;border-collapse:collapse;font-size:12px}
    td{border-top:1px solid #2c2922;padding:.5rem;vertical-align:top} tr.destacada{background:rgba(214,80,46,.1)}
    td span{display:inline-block;margin:0 .2rem .2rem 0;padding:0 .4rem;border:1px solid #2c2922;border-radius:99px}
    b{font-weight:500} .r{color:#7fd18b} .e{color:#e9b7a6} .tabla{overflow-x:auto}
  </style></head><body><main>
  <h1>Visitas · últimos 30 días</h1>
  <p>Anónimas: sin IP ni cookies. Destacadas: llegan desde un portal de empleo, desde la red de una empresa o han copiado tu email o abierto tu LinkedIn.</p>
  <div class="cifras">
    <div><strong>${visitas.length}</strong>visitas</div>
    <div><strong>${visitas.filter((v) => v.interesante).length}</strong>destacadas</div>
    <div><strong>${results.filter((f) => f.evento === 'ejecutar').length}</strong>proyectos ejecutados</div>
    <div><strong>${results.filter((f) => f.evento === 'email').length}</strong>emails copiados</div>
  </div>
  <section><h2>Visitas por día</h2><pre>${porDia.map(([d, n]) => `${d} ${barra(n, maxDia)} ${n}`).join('\n') || 'Sin datos todavía'}</pre></section>
  ${tabla('De dónde llegan', referencias)}
  ${tabla('Desde dónde', lugares)}
  ${tabla('Proyectos más ejecutados', proyectos)}
  <section><h2>Últimas visitas</h2><div class="tabla"><table>${filasVisitas || '<tr><td>Sin datos todavía</td></tr>'}</table></div></section>
  </main></body></html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}
