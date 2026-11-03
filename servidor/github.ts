/*
 * Datos de GitHub para la web. Se piden desde el Worker y se guardan en la
 * caché de Cloudflare 30 minutos: así no se agota el límite de 60 consultas
 * por hora de la API pública y el mapa de actividad (que GitHub no ofrece
 * con CORS) también llega al navegador.
 */

const USUARIO = 'AldairBZ'
// Repositorios que se muestran aunque no tengan la etiqueta «portfolio»
const POR_DEFECTO = [
  'LifeLevelUp',
  'TetrisGame',
  'GestorBonGustProject',
  'DeteccionMovimiento',
  'BlackJack-Proyecto-COBOL',
  'A2_ResidentEvil_Web',
  'BootCamp-TechTalent',
  'portfolio',
]
// Nunca se muestran: son personales
const BLOQUEADOS = ['08-03Love', 'Fther', 'AldairBZ']
const ETIQUETA = 'portfolio'

interface RepoApi {
  name: string
  language: string | null
  pushed_at: string
  html_url: string
  description: string | null
  topics?: string[]
  fork: boolean
  private: boolean
}

interface CommitApi {
  sha: string
  html_url: string
  commit: { message: string; author: { date: string } }
}

export interface DatosGitHub {
  repos: { name: string; language: string | null; pushed_at: string; html_url: string; description: string | null }[]
  commits: { repo: string; mensaje: string; fecha: string; url: string }[]
  actividad: { dias: { fecha: string; nivel: number }[]; total: number | null }
  generado: string
}

const cabeceras = { 'User-Agent': 'portfolio-aldairbz', Accept: 'application/vnd.github+json' }

// Con un token de solo lectura el límite pasa de 60 a 5000 consultas por hora
let token = ''

async function pedir<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: token ? { ...cabeceras, Authorization: `Bearer ${token}` } : cabeceras })
  if (!r.ok) throw new Error(`GitHub ${r.status} en ${url}`)
  return r.json() as Promise<T>
}

/** Un repositorio sale si tiene la etiqueta «portfolio» o está en la lista por defecto, y nunca si está bloqueado */
export function visible(repo: Pick<RepoApi, 'name' | 'topics' | 'fork' | 'private'>) {
  if (repo.private || repo.fork || BLOQUEADOS.includes(repo.name)) return false
  return (repo.topics ?? []).includes(ETIQUETA) || POR_DEFECTO.includes(repo.name)
}

/** Lee el calendario de contribuciones de la página pública de GitHub */
export function leerActividad(html: string) {
  const dias: { fecha: string; nivel: number }[] = []
  const re = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"|data-level="(\d)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    dias.push({ fecha: m[1] ?? m[4], nivel: Number(m[2] ?? m[3]) })
  }
  dias.sort((a, b) => a.fecha.localeCompare(b.fecha))
  const total = html.match(/([\d,.]+)\s+contributions?\s+in the last year/i)
  return { dias, total: total ? Number(total[1].replace(/[,.]/g, '')) : null }
}

async function construir(): Promise<DatosGitHub> {
  const todos = await pedir<RepoApi[]>(`https://api.github.com/users/${USUARIO}/repos?per_page=100&sort=pushed`)
  const repos = todos.filter(visible)

  const listas = await Promise.all(
    repos.slice(0, 4).map((r) =>
      pedir<CommitApi[]>(`https://api.github.com/repos/${USUARIO}/${r.name}/commits?per_page=3`)
        .then((cs) =>
          cs.map((c) => ({
            repo: r.name,
            mensaje: c.commit.message.split('\n')[0],
            fecha: c.commit.author.date,
            url: c.html_url,
          })),
        )
        .catch(() => []),
    ),
  )

  let actividad: DatosGitHub['actividad'] = { dias: [], total: null }
  try {
    const r = await fetch(`https://github.com/users/${USUARIO}/contributions`, { headers: { 'User-Agent': cabeceras['User-Agent'] } })
    if (r.ok) actividad = leerActividad(await r.text())
  } catch {
    // Sin mapa de actividad: el resto de datos sigue sirviendo
  }

  return {
    repos: repos.map(({ name, language, pushed_at, html_url, description }) => ({ name, language, pushed_at, html_url, description })),
    commits: listas
      .flat()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 6),
    actividad,
    generado: new Date().toISOString(),
  }
}

const json = (cuerpo: string, segundos: number) =>
  new Response(cuerpo, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${segundos}` },
  })

export async function responderGitHub(
  request: Request,
  ctx: { waitUntil(promesa: Promise<unknown>): void },
  tokenGitHub?: string,
) {
  token = tokenGitHub ?? ''
  const cache = caches.default
  const reciente = new Request(new URL('/api/github', request.url).toString())
  // Copia de la última respuesta buena, por si GitHub no responde más tarde
  const respaldo = new Request(new URL('/api/github?respaldo', request.url).toString())

  const guardada = await cache.match(reciente)
  if (guardada) return guardada

  try {
    const cuerpo = JSON.stringify(await construir())
    ctx.waitUntil(Promise.all([cache.put(reciente, json(cuerpo, 1800)), cache.put(respaldo, json(cuerpo, 604800))]))
    return json(cuerpo, 1800)
  } catch (e) {
    const anterior = await cache.match(respaldo)
    if (anterior) return json(await anterior.text(), 300)
    return Response.json({ error: String(e) }, { status: 502 })
  }
}
