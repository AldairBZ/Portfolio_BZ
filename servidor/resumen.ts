/*
 * Resumen del contador de visitas para el panel. Funciones puras, sin nada
 * de Cloudflare, para poder probarlas y compartir el tipo con la web.
 */

export const EVENTOS = ['visita', 'ejecutar', 'repo', 'clic', 'email', 'linkedin', 'github', 'idioma', 'seccion'] as const
export type Evento = (typeof EVENTOS)[number]

export interface Fila {
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

function contar(valores: string[], limite = 10): Ranking {
  const m = new Map<string, number>()
  for (const v of valores) if (v) m.set(v, (m.get(v) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite)
}

/** Cuántas personas distintas (sesiones) hicieron cada cosa */
function personas(filas: Fila[], limite = 10): Ranking {
  const m = new Map<string, Set<string>>()
  for (const f of filas) if (f.detalle) m.set(f.detalle, (m.get(f.detalle) ?? new Set()).add(f.sesion))
  return [...m.entries()].map(([k, s]): [string, number] => [k, s.size]).sort((a, b) => b[1] - a[1]).slice(0, limite)
}

/** Resume los eventos de los últimos días para el panel; solo datos agregados y anónimos */
export function resumir(filas: Fila[], hoy = new Date()) {
  const sesiones = new Map<string, Fila[]>()
  // Llegan de más reciente a más antiguo
  for (const f of filas) sesiones.set(f.sesion, [...(sesiones.get(f.sesion) ?? []), f])
  const visitas = [...sesiones.values()].map((eventos) => {
    const primera = eventos[eventos.length - 1]
    const portal = PORTALES_EMPLEO.test(primera.referencia)
    const empresa = Boolean(primera.red) && !OPERADORES.test(primera.red)
    const acciones = eventos
      .filter((e) => e.evento !== 'visita')
      .reverse()
      .map((e) => (e.detalle ? `${e.evento}: ${e.detalle}` : e.evento))
    const contacto = eventos.some((e) => e.evento === 'email' || e.evento === 'linkedin')
    return { primera, portal, empresa, acciones, destacada: portal || empresa || contacto }
  })

  const porDia: Ranking = []
  for (let i = DIAS - 1; i >= 0; i--) {
    const dia = new Date(hoy.getTime() - i * 86400000).toISOString().slice(0, 10)
    porDia.push([dia, visitas.filter((v) => v.primera.fecha.startsWith(dia)).length])
  }
  const de = (evento: Evento) => filas.filter((f) => f.evento === evento)

  return {
    dias: DIAS,
    totales: {
      visitas: visitas.length,
      destacadas: visitas.filter((v) => v.destacada).length,
      proyectos: de('ejecutar').length,
      repos: de('repo').length,
      clics: de('clic').length + de('repo').length + de('email').length + de('linkedin').length + de('github').length,
      contacto: de('email').length + de('linkedin').length,
    },
    porDia,
    proyectos: personas(de('ejecutar')),
    repos: personas(de('repo')),
    clics: contar(
      filas.filter((f) => ['clic', 'repo', 'email', 'linkedin', 'github'].includes(f.evento)).map((f) => (f.detalle ? `${f.evento}: ${f.detalle}` : f.evento)),
      15,
    ),
    secciones: personas(de('seccion')),
    referencias: contar(visitas.map((v) => v.primera.referencia || 'directo')),
    lugares: contar(visitas.map((v) => [v.primera.ciudad, v.primera.pais].filter(Boolean).join(', '))),
    dispositivos: contar(visitas.map((v) => v.primera.dispositivo)),
    idiomas: contar(visitas.map((v) => v.primera.idioma)),
    ultimas: visitas.slice(0, 30).map((v) => ({
      fecha: v.primera.fecha,
      lugar: [v.primera.ciudad, v.primera.pais].filter(Boolean).join(', '),
      referencia: v.primera.referencia || 'directo',
      dispositivo: v.primera.dispositivo,
      idioma: v.primera.idioma,
      portal: v.portal,
      empresa: v.empresa ? v.primera.red : '',
      acciones: v.acciones.slice(0, 25),
    })),
  }
}

export type ResumenPanel = ReturnType<typeof resumir>
