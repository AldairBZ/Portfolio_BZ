/*
 * Resumen del contador de visitas para el panel. Funciones puras, sin nada
 * de Cloudflare, para poder probarlas y compartir el tipo con la web.
 */

export const EVENTOS = ['visita', 'ejecutar', 'repo', 'clic', 'email', 'linkedin', 'github', 'idioma', 'seccion'] as const
export type Evento = (typeof EVENTOS)[number]

export interface Fila {
  fecha: string
  sesion: string
  /** Huella anónima de la persona (ver visitas.ts); vacía en eventos antiguos */
  visitante?: string | null
  evento: string
  detalle: string
  idioma: string
  referencia: string
  pais: string
  ciudad: string
  red: string
  dispositivo: string
}

// Webs de empleo: si alguien llega desde aquí, probablemente busca candidatos
const PORTALES_EMPLEO = /linkedin|lnkd|infojobs|indeed|glassdoor|tecnoempleo|computrabajo|welcometothejungle|jobs|joinrs|manfred|wellfound/i
// Operadores domésticos y móviles: desde estas redes no se puede saber la empresa
const OPERADORES = /telef[oó]nica|movistar|vodafone|orange|digi|m[aá]sm[oó]vil|jazztel|yoigo|pepephone|lowi|euskaltel|r cable|telecable|avatel|adamo|o2|simyo|finetwork|starlink|comcast|verizon|at&t|t-mobile|free sas|sfr|bouygues|claro|tigo|movil|mobile|cellular|wireless|broadband|telecom|cable|google llc|cloudflare|amazon|microsoft/i

export const DIAS = 30

/** Compara en tiempo constante para no dar pistas por el tiempo de respuesta */
export function iguales(recibido: string, esperado: string) {
  const a = new TextEncoder().encode(recibido)
  const b = new TextEncoder().encode(esperado)
  let diferencia = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diferencia |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diferencia === 0
}

type Ranking = [string, number][]

/** De dónde llega alguien: ?ref= de mis enlaces, la web de origen o directo */
export function origen(referencia: string) {
  const r = referencia.toLowerCase()
  if (!r) return 'Directo'
  if (/linkedin|lnkd/.test(r)) return 'LinkedIn'
  if (/github/.test(r)) return 'GitHub'
  if (r.startsWith('ref:')) return r.slice(4)
  if (/google|bing|duckduckgo|ecosia|yahoo/.test(r)) return 'Buscador'
  return r
}

const quien = (f: Fila) => f.visitante || f.sesion

function contar(valores: string[], limite = 10): Ranking {
  const m = new Map<string, number>()
  for (const v of valores) if (v) m.set(v, (m.get(v) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite)
}

/** Cuántas personas distintas hicieron cada cosa: 20 clics de la misma persona cuentan 1 */
function personas(filas: Fila[], clave: (f: Fila) => string, limite = 10): Ranking {
  const m = new Map<string, Set<string>>()
  for (const f of filas) {
    const k = clave(f)
    if (k) m.set(k, (m.get(k) ?? new Set()).add(quien(f)))
  }
  return [...m.entries()].map(([k, s]): [string, number] => [k, s.size]).sort((a, b) => b[1] - a[1]).slice(0, limite)
}

const CLICS = ['clic', 'repo', 'email', 'linkedin', 'github']

/** Resume los eventos para el panel: cada persona cuenta una vez, vuelva cuantas veces vuelva */
export function resumir(filas: Fila[], hoy = new Date()) {
  // Eventos de cada persona, del más antiguo al más reciente
  const porPersona = new Map<string, Fila[]>()
  for (const f of [...filas].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    porPersona.set(quien(f), [...(porPersona.get(quien(f)) ?? []), f])
  }
  const gente = [...porPersona.values()].map((eventos) => {
    const primera = eventos[0]
    const entradas = eventos.filter((e) => e.evento === 'visita')
    const origenes = [...new Set((entradas.length ? entradas : [primera]).map((e) => origen(e.referencia)))]
    const portal = entradas.some((e) => PORTALES_EMPLEO.test(e.referencia) || origen(e.referencia) === 'LinkedIn')
    const red = eventos.find((e) => e.red)?.red ?? ''
    const empresa = red && !OPERADORES.test(red) ? red : ''
    const acciones = [
      ...new Set(eventos.filter((e) => e.evento !== 'visita' && e.evento !== 'seccion').map((e) => (e.detalle ? `${e.evento}: ${e.detalle}` : e.evento))),
    ]
    const contacto = eventos.some((e) => e.evento === 'email' || e.evento === 'linkedin')
    return {
      primera,
      ultima: eventos[eventos.length - 1].fecha,
      visitas: new Set(eventos.map((e) => e.sesion)).size,
      origenes,
      portal,
      empresa,
      acciones,
      contacto,
      destacada: portal || Boolean(empresa) || contacto || origenes.includes('GitHub'),
    }
  })

  const porDia: Ranking = []
  for (let i = DIAS - 1; i >= 0; i--) {
    const dia = new Date(hoy.getTime() - i * 86400000).toISOString().slice(0, 10)
    porDia.push([dia, gente.filter((g) => g.primera.fecha.startsWith(dia)).length])
  }
  const de = (...eventos: string[]) => filas.filter((f) => eventos.includes(f.evento))
  const hoyIso = hoy.toISOString().slice(0, 10)

  return {
    dias: DIAS,
    totales: {
      personas: gente.length,
      nuevasHoy: gente.filter((g) => g.primera.fecha.startsWith(hoyIso)).length,
      linkedin: gente.filter((g) => g.origenes.includes('LinkedIn')).length,
      github: gente.filter((g) => g.origenes.includes('GitHub')).length,
      proyectos: new Set(de('ejecutar').map(quien)).size,
      contacto: gente.filter((g) => g.contacto).length,
    },
    porDia,
    origenes: contar(gente.flatMap((g) => g.origenes)),
    proyectos: personas(de('ejecutar'), (f) => f.detalle),
    repos: personas(de('repo'), (f) => f.detalle),
    clics: personas(de(...CLICS), (f) => (f.detalle ? `${f.evento}: ${f.detalle}` : f.evento), 15),
    secciones: personas(de('seccion'), (f) => f.detalle),
    lugares: contar(gente.map((g) => [g.primera.ciudad, g.primera.pais].filter(Boolean).join(', '))),
    dispositivos: contar(gente.map((g) => g.primera.dispositivo)),
    idiomas: contar(gente.map((g) => g.primera.idioma)),
    ultimas: gente
      .sort((a, b) => b.ultima.localeCompare(a.ultima))
      .slice(0, 30)
      .map((g) => ({
        primera: g.primera.fecha,
        ultima: g.ultima,
        visitas: g.visitas,
        origenes: g.origenes,
        lugar: [g.primera.ciudad, g.primera.pais].filter(Boolean).join(', '),
        dispositivo: g.primera.dispositivo,
        idioma: g.primera.idioma,
        portal: g.portal,
        empresa: g.empresa,
        destacada: g.destacada,
        acciones: g.acciones.slice(0, 25),
      })),
  }
}

export type ResumenPanel = ReturnType<typeof resumir>
