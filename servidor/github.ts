/*
 * Datos de GitHub para la web, pedidos desde el Worker y guardados en la caché de Cloudflare.
 * Salen todos mis repositorios públicos (también los que cree mañana), nunca forks ni repos de
 * otros, y de ellos solo mis commits grandes: nada de merges ni de «Update README.md».
 *
 * Se refresca cada 10 minutos, o cada 2 si hay un token de solo lectura (GITHUB_TOKEN): sin él,
 * la API pública solo deja 60 consultas por hora. El tamaño de cada commit se guarda para
 * siempre (un commit no cambia), así que cada refresco cuesta muy pocas consultas.
 */

const USUARIO = 'AldairBZ'
// Nunca se muestran: son personales (y el del perfil solo tiene el README)
const BLOQUEADOS = ['08-03Love', 'Fther', 'AldairBZ']
// De cuántos repositorios recientes se miran commits, y cuántos de cada uno
const REPOS_A_MIRAR = 6
const COMMITS_POR_REPO = 10
// Commits nuevos cuyo tamaño se pide en cada refresco (los ya vistos salen de la caché)
const DETALLES_POR_REFRESCO = 12
const COMMITS_A_MOSTRAR = 6
// Un commit es grande si cambia al menos esto
const LINEAS_MINIMAS = 30
const ARCHIVOS_MINIMOS = 3

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
  author: { login: string } | null
  parents: { sha: string }[]
}

interface DetalleApi {
  stats?: { additions: number; deletions: number }
  files?: unknown[]
}

/** Lo que importa de un commit para saber si es grande. */
export interface Tamano {
  mas: number
  menos: number
  archivos: number
}

export interface DatosGitHub {
  repos: { name: string; language: string | null; pushed_at: string; html_url: string; description: string | null }[]
  commits: { repo: string; mensaje: string; fecha: string; url: string; mas: number; menos: number; archivos: number }[]
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

/** Salen todos mis repositorios públicos y creados por mí: ni forks, ni privados, ni los personales */
export function visible(repo: Pick<RepoApi, 'name' | 'fork' | 'private'>) {
  return !repo.private && !repo.fork && !BLOQUEADOS.includes(repo.name)
}

// Los mensajes que pone GitHub solo al editar desde la web, y los de mantenimiento
const MENOR = /^(Merge (pull request|branch|remote-tracking)|Update |Create |Delete |Rename |Initial commit|Add files via upload)/i

/** Un commit cuenta si es mío, no es un merge, no es un mensaje automático de GitHub y cambia bastante */
export function esGrande(c: { autor: string | null; padres: number; mensaje: string }, t?: Tamano) {
  if (c.autor?.toLowerCase() !== USUARIO.toLowerCase() || c.padres > 1 || MENOR.test(c.mensaje)) return false
  if (!t) return true
  // Lo que casi solo borra (quitar compilados, limpiar) no es un gran trabajo
  if (t.menos > t.mas * 10 && t.menos > LINEAS_MINIMAS) return false
  return t.mas + t.menos >= LINEAS_MINIMAS || t.archivos >= ARCHIVOS_MINIMOS
}

/** El tamaño de un commit: de la caché si ya se vio, o de la API (y se guarda para siempre) */
async function tamanoDe(repo: string, sha: string, presupuesto: { quedan: number }): Promise<Tamano | null> {
  const cache = caches.default
  const clave = new Request(`https://cache.scheneiderbz.pages.dev/github/commit/${repo}/${sha}`)
  const visto = await cache.match(clave)
  if (visto) return visto.json()
  if (presupuesto.quedan <= 0) return null
  presupuesto.quedan--
  const d = await pedir<DetalleApi>(`https://api.github.com/repos/${USUARIO}/${repo}/commits/${sha}`)
  const t: Tamano = { mas: d.stats?.additions ?? 0, menos: d.stats?.deletions ?? 0, archivos: d.files?.length ?? 0 }
  await cache.put(clave, Response.json(t, { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }))
  return t
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

  // Mis commits en los repositorios con actividad más reciente, sin merges ni mensajes automáticos
  const listas = await Promise.all(
    repos.slice(0, REPOS_A_MIRAR).map((r) =>
      pedir<CommitApi[]>(`https://api.github.com/repos/${USUARIO}/${r.name}/commits?author=${USUARIO}&per_page=${COMMITS_POR_REPO}`)
        .then((cs) =>
          cs
            .map((c) => ({ c, mensaje: c.commit.message.split('\n')[0] }))
            .filter(({ c, mensaje }) => esGrande({ autor: c.author?.login ?? null, padres: c.parents.length, mensaje }))
            .map(({ c, mensaje }) => ({ repo: r.name, sha: c.sha, mensaje, fecha: c.commit.author.date, url: c.html_url })),
        )
        .catch(() => []),
    ),
  )
  const candidatos = listas.flat().sort((a, b) => b.fecha.localeCompare(a.fecha))
  // De más reciente a más antiguo, hasta tener los que se enseñan: solo los que cambian bastante
  const presupuesto = { quedan: DETALLES_POR_REFRESCO }
  const commits: DatosGitHub['commits'] = []
  for (const c of candidatos) {
    if (commits.length >= COMMITS_A_MOSTRAR) break
    const t = await tamanoDe(c.repo, c.sha, presupuesto).catch(() => null)
    if (!t || !esGrande({ autor: USUARIO, padres: 1, mensaje: c.mensaje }, t)) continue
    commits.push({ repo: c.repo, mensaje: c.mensaje, fecha: c.fecha, url: c.url, mas: t.mas, menos: t.menos, archivos: t.archivos })
  }

  let actividad: DatosGitHub['actividad'] = { dias: [], total: null }
  try {
    const r = await fetch(`https://github.com/users/${USUARIO}/contributions`, { headers: { 'User-Agent': cabeceras['User-Agent'] } })
    if (r.ok) actividad = leerActividad(await r.text())
  } catch {
    // Sin mapa de actividad: el resto de datos sigue sirviendo
  }

  return {
    repos: repos.map(({ name, language, pushed_at, html_url, description }) => ({ name, language, pushed_at, html_url, description })),
    commits,
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

  // Con token, casi en directo; sin él, sin pasarse del límite de la API pública
  const segundos = token ? 120 : 600
  try {
    const cuerpo = JSON.stringify(await construir())
    ctx.waitUntil(Promise.all([cache.put(reciente, json(cuerpo, segundos)), cache.put(respaldo, json(cuerpo, 604800))]))
    return json(cuerpo, segundos)
  } catch (e) {
    const anterior = await cache.match(respaldo)
    if (anterior) return json(await anterior.text(), 300)
    return Response.json({ error: String(e) }, { status: 502 })
  }
}
