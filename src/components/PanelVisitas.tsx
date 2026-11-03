import { useEffect, useRef, useState, type FormEvent } from 'react'
import { bloquearScroll } from '../lib/scroll'
import type { ResumenPanel } from '../../servidor/resumen'
import './PanelVisitas.css'

/*
 * Panel privado del contador de visitas. Se abre al pulsar la oreja del retrato
 * y pide usuario y contraseña; el servidor los compara con sus secretos y solo
 * entonces devuelve el resumen. Es solo para mí, así que está en español.
 */

type Ranking = [string, number][]

const barra = (n: number, max: number, largo = 22) => {
  const lleno = Math.round((n / Math.max(max, 1)) * largo)
  return '█'.repeat(lleno) + '·'.repeat(largo - lleno)
}

function Tabla({ titulo, filas, unidad }: { titulo: string; filas: Ranking; unidad?: string }) {
  return (
    <section className="panel__bloque">
      <h3>{titulo}</h3>
      {filas.length ? (
        <ol>
          {filas.map(([nombre, n]) => (
            <li key={nombre}>
              <span className="panel__nombre" title={nombre}>
                {nombre}
              </span>
              <span className="panel__barra" aria-hidden="true">
                {barra(n, filas[0][1])}
              </span>
              <span className="panel__numero">
                {n}
                {unidad && <small> {unidad}</small>}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="panel__vacio">Sin datos todavía</p>
      )}
    </section>
  )
}

/** Visitas por día como columnas de caracteres */
function Dias({ dias }: { dias: Ranking }) {
  const max = Math.max(...dias.map(([, n]) => n), 1)
  const alto = 6
  return (
    <section className="panel__bloque panel__bloque--ancho">
      <h3>Visitas por día</h3>
      <div className="panel__dias" role="img" aria-label={dias.map(([d, n]) => `${d}: ${n}`).join(', ')}>
        {dias.map(([dia, n]) => {
          const nivel = Math.round((n / max) * alto)
          return (
            <span key={dia} title={`${dia}: ${n}`}>
              {Array.from({ length: alto }, (_, i) => (alto - i <= nivel ? '█' : '·')).join('\n')}
            </span>
          )
        })}
      </div>
      <p className="panel__eje">
        <span>{dias[0]?.[0]}</span>
        <span>hoy</span>
      </p>
    </section>
  )
}

const fecha = (iso: string) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

function Resumen({ datos }: { datos: ResumenPanel }) {
  const cifras: [number, string][] = [
    [datos.totales.personas, 'personas distintas'],
    [datos.totales.nuevasHoy, 'nuevas hoy'],
    [datos.totales.linkedin, 'desde LinkedIn'],
    [datos.totales.github, 'desde GitHub'],
    [datos.totales.proyectos, 'han ejecutado un proyecto'],
    [datos.totales.contacto, 'email o LinkedIn'],
  ]
  return (
    <>
      <p className="panel__nota">
        Cada persona cuenta una sola vez, aunque vuelva o haga muchos clics. Los números de las tablas son personas
        distintas.
      </p>
      <div className="panel__cifras">
        {cifras.map(([n, texto]) => (
          <p key={texto}>
            <strong>{n}</strong>
            {texto}
          </p>
        ))}
      </div>
      <div className="panel__rejilla">
        <Dias dias={datos.porDia} />
        <Tabla titulo="De dónde llegan" filas={datos.origenes} unidad="pers." />
        <Tabla titulo="Proyectos ejecutados" filas={datos.proyectos} unidad="pers." />
        <Tabla titulo="Repositorios abiertos" filas={datos.repos} unidad="pers." />
        <Tabla titulo="Todos los clics" filas={datos.clics} unidad="pers." />
        <Tabla titulo="Hasta dónde bajan" filas={datos.secciones} unidad="pers." />
        <Tabla titulo="Desde dónde" filas={datos.lugares} unidad="pers." />
        <Tabla titulo="Dispositivo" filas={datos.dispositivos} unidad="pers." />
        <Tabla titulo="Idioma" filas={datos.idiomas} unidad="pers." />
      </div>
      <section className="panel__bloque panel__bloque--ancho">
        <h3>Últimas personas</h3>
        {datos.ultimas.length ? (
          <ul className="panel__visitas">
            {datos.ultimas.map((v) => (
              <li key={v.primera + v.lugar} className={v.destacada ? 'panel__visita--destacada' : ''}>
                <p>
                  <strong>{fecha(v.ultima)}</strong>
                  {' · '}
                  {v.lugar || '—'} · {v.dispositivo} · {v.idioma}
                  {v.visitas > 1 && ` · ${v.visitas} visitas desde el ${fecha(v.primera)}`}
                </p>
                <p className="panel__marcas">
                  {v.origenes.map((o) => (
                    <span key={o} className={o === 'Directo' ? 'panel__marca--neutra' : ''}>
                      {o === 'Directo' ? 'entró directamente' : `llegó desde ${o}`}
                    </span>
                  ))}
                  {v.empresa && <span>red de empresa: {v.empresa}</span>}
                </p>
                {v.acciones.length > 0 && <p className="panel__acciones">{v.acciones.join('  ·  ')}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel__vacio">Sin datos todavía</p>
        )}
      </section>
    </>
  )
}

export default function PanelVisitas({ onCerrar }: { onCerrar: () => void }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [datos, setDatos] = useState<ResumenPanel | null>(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bloquearScroll(true)
    campo.current?.focus()
    const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclado)
    return () => {
      bloquearScroll(false)
      window.removeEventListener('keydown', alTeclado)
    }
  }, [onCerrar])

  const pedir = async (e?: FormEvent) => {
    e?.preventDefault()
    setCargando(true)
    setError('')
    try {
      const respuesta = await fetch('/api/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, clave }),
      })
      if (respuesta.status === 401) throw new Error('Usuario o contraseña incorrectos')
      if (!respuesta.ok) throw new Error('El panel no está disponible ahora mismo')
      setDatos(await respuesta.json())
    } catch (err) {
      setError(err instanceof Error && err.message.startsWith('Usuario') ? err.message : 'El panel no está disponible ahora mismo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="panel" role="presentation" onClick={onCerrar} data-sin-registro data-lenis-prevent>
      <div
        className={`panel__ventana${datos ? ' panel__ventana--abierta' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Panel de visitas"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel__cabecera">
          <div>
            <p className="etiqueta">{datos ? `Últimos ${datos.dias} días · anónimo` : 'Acceso privado'}</p>
            <h2>Panel de visitas</h2>
          </div>
          <div className="panel__botones">
            {datos && (
              <button type="button" className="boton" onClick={() => pedir()} disabled={cargando}>
                {cargando ? 'Actualizando…' : 'Actualizar'}
              </button>
            )}
            <button type="button" className="boton panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
              ×
            </button>
          </div>
        </header>

        {datos ? (
          <div className="panel__contenido">
            <Resumen datos={datos} />
          </div>
        ) : (
          <form className="panel__acceso" onSubmit={pedir}>
            <label>
              Usuario
              <input ref={campo} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className="panel__error">{error}</p>}
            <button type="submit" className="boton boton--lleno" disabled={cargando}>
              {cargando ? 'Comprobando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
