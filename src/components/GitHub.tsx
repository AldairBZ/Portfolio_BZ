import { useEffect, useRef, useState } from 'react'
import { useIdioma, type Idioma } from '../lib/idioma'
import Resplandor from './Resplandor'
import './GitHub.css'

const USUARIO = 'AldairBZ'
// Respaldo si el Worker no responde (por ejemplo, en desarrollo): solo estos repositorios
const REPOS = [
  'LifeLevelUp',
  'TetrisGame',
  'GestorBonGustProject',
  'DeteccionMovimiento',
  'BlackJack-Proyecto-COBOL',
  'A2_ResidentEvil_Web',
  'BootCamp-TechTalent',
  'portfolio',
]

interface Repo {
  name: string
  language: string | null
  pushed_at: string
  html_url: string
}

interface Commit {
  repo: string
  mensaje: string
  fecha: string
  url: string
}

interface Actividad {
  dias: { fecha: string; nivel: number }[]
  total: number | null
}

interface Datos {
  repos: Repo[]
  commits: Commit[]
  actividad: Actividad
}

const coloresLenguaje: Record<string, string> = {
  JavaScript: '#e9c46a',
  TypeScript: '#5f8fc4',
  Java: '#d6502e',
  Python: '#a9c4b1',
  'C#': '#9b7fd1',
  HTML: '#e9b7a6',
  CSS: '#7d7566',
  COBOL: '#b8ae9c',
}

function haceCuanto(fecha: string, idioma: Idioma) {
  // Intl da 'hoy', 'ayer', 'hace 3 días'… en cada idioma
  const formato = new Intl.RelativeTimeFormat(idioma, { numeric: 'auto' })
  // Un reloj del visitante algo atrasado no debe mostrar «mañana»
  const dias = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000))
  if (dias < 30) return formato.format(-dias, 'day')
  return formato.format(-Math.floor(dias / 30), 'month')
}

async function pedir<T>(url: string): Promise<T> {
  const clave = `gh:${url}`
  try {
    const guardado = sessionStorage.getItem(clave)
    if (guardado) return JSON.parse(guardado)
  } catch {
    // sessionStorage puede no estar disponible
  }
  const respuesta = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!respuesta.ok) throw new Error(String(respuesta.status))
  const datos = await respuesta.json()
  try {
    sessionStorage.setItem(clave, JSON.stringify(datos))
  } catch {
    // Sin caché: no pasa nada
  }
  return datos
}

async function cargarDirecto(): Promise<Datos> {
  const todos = await pedir<Repo[]>(`https://api.github.com/users/${USUARIO}/repos?per_page=100&sort=pushed`)
  const propios = todos.filter((r) => REPOS.includes(r.name))
  // Los últimos commits de los cuatro repositorios con actividad más reciente
  const listas = await Promise.all(
    propios.slice(0, 4).map((r) =>
      pedir<{ html_url: string; commit: { message: string; author: { date: string } } }[]>(
        `https://api.github.com/repos/${USUARIO}/${r.name}/commits?per_page=3`,
      )
        .then((cs) =>
          cs.map((c) => ({ repo: r.name, mensaje: c.commit.message.split('\n')[0], fecha: c.commit.author.date, url: c.html_url })),
        )
        .catch(() => [] as Commit[]),
    ),
  )
  return {
    repos: propios,
    commits: listas
      .flat()
      .sort((x, y) => y.fecha.localeCompare(x.fecha))
      .slice(0, 6),
    actividad: { dias: [], total: null },
  }
}

const NIVELES = ['·', ':', '=', '#', '@']

/** Calendario de contribuciones dibujado con caracteres: una columna por semana */
function MapaActividad({ actividad }: { actividad: Actividad }) {
  const { t, idioma } = useIdioma()
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // En pantallas estrechas se muestra primero lo más reciente
    const el = contenedor.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [actividad])

  if (!actividad.dias.length) return null
  const semanas: { fecha: string; nivel: number }[][] = []
  const primero = new Date(actividad.dias[0].fecha).getUTCDay()
  const celdas = [...Array(primero).fill(null), ...actividad.dias]
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7))

  return (
    <figure className="actividad">
      <figcaption className="etiqueta">
        {actividad.total !== null
          ? t(
              `${actividad.total} contribuciones en el último año`,
              `${actividad.total} contributions in the last year`,
              `${actividad.total} contribucions en l'últim any`,
            )
          : t('Actividad del último año', 'Activity in the last year')}
      </figcaption>
      <div className="actividad__rejilla" ref={contenedor} role="img" aria-label={t('Mapa de contribuciones de GitHub', 'GitHub contributions map')}>
        {semanas.map((semana, i) => (
          <div key={i} className="actividad__semana">
            {semana.map((dia, j) =>
              dia ? (
                <span
                  key={j}
                  className={`actividad__dia actividad__dia--${dia.nivel}`}
                  title={new Date(dia.fecha).toLocaleDateString(idioma, { day: 'numeric', month: 'short', year: 'numeric' })}
                >
                  {NIVELES[dia.nivel] ?? '·'}
                </span>
              ) : (
                <span key={j} className="actividad__dia" />
              ),
            )}
          </div>
        ))}
      </div>
    </figure>
  )
}

export default function GitHub() {
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [error, setError] = useState(false)
  const [actividad, setActividad] = useState<Actividad | null>(null)
  const { idioma, t } = useIdioma()

  useEffect(() => {
    // El Worker de Cloudflare junta repos, commits y mapa de actividad con caché;
    // si no está disponible, se pide directamente a la API pública de GitHub
    pedir<Datos>('/api/github')
      .then((datos) => {
        if (!Array.isArray(datos.repos)) throw new Error('Respuesta no válida')
        return datos
      })
      .catch(cargarDirecto)
      .then((datos) => {
        setRepos(datos.repos)
        setCommits(datos.commits)
        setActividad(datos.actividad)
      })
      .catch(() => setError(true))
  }, [])

  const porLenguaje = new Map<string, number>()
  for (const r of repos ?? []) {
    if (r.language) porLenguaje.set(r.language, (porLenguaje.get(r.language) ?? 0) + 1)
  }
  const total = [...porLenguaje.values()].reduce((a, b) => a + b, 0)
  const lenguajes = [...porLenguaje.entries()].sort((a, b) => b[1] - a[1])

  return (
    <section className="github" aria-labelledby="github-titulo">
      <div className="github__contenido">
        <header className="github__cabecera">
          <p className="etiqueta">
            <span className="github__vivo" aria-hidden="true" /> {t('En directo', 'Live')} · api.github.com
          </p>
          <h2 id="github-titulo" className="github__titulo">
            <Resplandor color="var(--azul)" />
            {t('Lo último que', 'What I’ve been')}
            <br />
            <em>{t('he subido.', 'pushing lately.')}</em>
          </h2>
        </header>

        {error && (
          <p className="github__error">
            {t('GitHub no responde ahora mismo. Puedes ver todo en', 'GitHub is not responding right now. You can see everything at')}{' '}
            <a href={`https://github.com/${USUARIO}`}>github.com/{USUARIO}</a>.
          </p>
        )}

        {actividad && <MapaActividad actividad={actividad} />}

        <div className="github__rejilla">
          <ol className="github__commits" aria-label={t('Commits recientes', 'Recent commits')}>
            {(commits.length ? commits : Array.from({ length: 4 }, () => null)).map((c, i) =>
              c ? (
                <li key={c.url}>
                  <a href={c.url} target="_blank" rel="noreferrer">
                    <span className="github__repo">{c.repo}</span>
                    <span className="github__mensaje">{c.mensaje}</span>
                    <span className="github__fecha">{haceCuanto(c.fecha, idioma)}</span>
                  </a>
                </li>
              ) : (
                <li key={i} className="github__esqueleto" aria-hidden="true" />
              ),
            )}
          </ol>

          <div className="github__lenguajes">
            <p className="etiqueta">{t('Lenguajes en mis repositorios', 'Languages in my repositories')}</p>
            <div className="github__barra" role="img" aria-label={lenguajes.map(([l]) => l).join(', ')}>
              {lenguajes.map(([lenguaje, peso]) => (
                <span
                  key={lenguaje}
                  style={{ flexGrow: peso / total, background: coloresLenguaje[lenguaje] ?? '#7d7566' }}
                />
              ))}
            </div>
            <ul className="github__leyenda">
              {lenguajes.map(([lenguaje, peso]) => (
                <li key={lenguaje}>
                  <span style={{ background: coloresLenguaje[lenguaje] ?? '#7d7566' }} aria-hidden="true" />
                  {lenguaje} <small>{Math.round((peso / total) * 100)}%</small>
                </li>
              ))}
            </ul>
            <ul className="github__repos">
              {(repos ?? []).slice(0, 5).map((r) => (
                <li key={r.name}>
                  <a href={r.html_url} target="_blank" rel="noreferrer">
                    {r.name}
                  </a>
                  <span>{haceCuanto(r.pushed_at, idioma)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
