import { useEffect, useState } from 'react'
import './GitHub.css'

const USUARIO = 'AldairBZ'
// Solo los repositorios de código; el resto de la cuenta no se muestra
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

function haceCuanto(fecha: string) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000)
  if (dias < 1) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  const meses = Math.floor(dias / 30)
  return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`
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

export default function GitHub() {
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    pedir<Repo[]>(`https://api.github.com/users/${USUARIO}/repos?per_page=100&sort=pushed`)
      .then(async (todos) => {
        const propios = todos.filter((r) => REPOS.includes(r.name))
        setRepos(propios)
        // Los últimos commits de los cuatro repositorios con actividad más reciente
        const listas = await Promise.all(
          propios.slice(0, 4).map((r) =>
            pedir<{ sha: string; html_url: string; commit: { message: string; author: { date: string } } }[]>(
              `https://api.github.com/repos/${USUARIO}/${r.name}/commits?per_page=3`,
            )
              .then((cs) =>
                cs.map((c) => ({
                  repo: r.name,
                  mensaje: c.commit.message.split('\n')[0],
                  fecha: c.commit.author.date,
                  url: c.html_url,
                })),
              )
              .catch(() => [] as Commit[]),
          ),
        )
        setCommits(
          listas
            .flat()
            .sort((x, y) => y.fecha.localeCompare(x.fecha))
            .slice(0, 6),
        )
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
            <span className="github__vivo" aria-hidden="true" /> En directo · api.github.com
          </p>
          <h2 id="github-titulo" className="github__titulo">
            Lo último que
            <br />
            <em>he subido.</em>
          </h2>
        </header>

        {error && (
          <p className="github__error">
            GitHub no responde ahora mismo. Puedes ver todo en{' '}
            <a href={`https://github.com/${USUARIO}`}>github.com/{USUARIO}</a>.
          </p>
        )}

        <div className="github__rejilla">
          <ol className="github__commits" aria-label="Commits recientes">
            {(commits.length ? commits : Array.from({ length: 4 }, () => null)).map((c, i) =>
              c ? (
                <li key={c.url}>
                  <a href={c.url} target="_blank" rel="noreferrer">
                    <span className="github__repo">{c.repo}</span>
                    <span className="github__mensaje">{c.mensaje}</span>
                    <span className="github__fecha">{haceCuanto(c.fecha)}</span>
                  </a>
                </li>
              ) : (
                <li key={i} className="github__esqueleto" aria-hidden="true" />
              ),
            )}
          </ol>

          <div className="github__lenguajes">
            <p className="etiqueta">Lenguajes en mis repositorios</p>
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
                  <span>{haceCuanto(r.pushed_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
