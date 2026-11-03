import { lazy, Suspense, useEffect, useRef } from 'react'
import { bloquearScroll } from '../../lib/scroll'
import type { Proyecto } from '../../data/proyectos'
import './Ejecutor.css'
import './Ejecutores.css'

const EjecutorWeb = lazy(() => import('./EjecutorWeb'))
const EjecutorJava = lazy(() => import('./EjecutorJava'))
const EjecutorPython = lazy(() => import('./EjecutorPython'))
const EjecutorCamara = lazy(() => import('./EjecutorCamara'))
const EjecutorCodigo = lazy(() => import('./EjecutorCodigo'))
const EjecutorCobol = lazy(() => import('./EjecutorCobol'))

const etiquetas = {
  web: 'Aplicación web',
  java: 'Java en el navegador',
  python: 'Python en el navegador',
  camara: 'Visión por computador',
  codigo: 'Código fuente',
  cobol: 'COBOL en el navegador',
}

interface Props {
  proyecto: Proyecto
  onCerrar: () => void
}

export default function Ejecutor({ proyecto, onCerrar }: Props) {
  const dialogo = useRef<HTMLDivElement>(null)
  const { ejecucion } = proyecto

  useEffect(() => {
    bloquearScroll(true)
    const anterior = document.activeElement as HTMLElement | null
    dialogo.current?.focus()
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclado)
    return () => {
      bloquearScroll(false)
      window.removeEventListener('keydown', alTeclado)
      anterior?.focus()
    }
  }, [onCerrar])

  return (
    <div className="ejecutor" role="presentation" onClick={onCerrar}>
      <div
        ref={dialogo}
        className="ejecutor__ventana"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ejecutor-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ejecutor__barra">
          <div>
            <p className="etiqueta">{etiquetas[ejecucion.tipo]}</p>
            <h2 id="ejecutor-titulo" className="ejecutor__titulo">
              {proyecto.nombre}
            </h2>
          </div>
          <div className="ejecutor__botones">
            {proyecto.demo && (
              <a className="boton ejecutor__extra" href={proyecto.demo} target="_blank" rel="noreferrer">
                Pestaña nueva ↗
              </a>
            )}
            <a className="boton ejecutor__extra" href={proyecto.repo} target="_blank" rel="noreferrer">
              Código ↗
            </a>
            <button type="button" className="boton ejecutor__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </header>

        <div className="ejecutor__cuerpo">
          <div className="ejecutor__escena">
            <Suspense fallback={<Cargando texto="Preparando el entorno…" />}>
              {ejecucion.tipo === 'web' && <EjecutorWeb url={ejecucion.url} titulo={proyecto.nombre} />}
              {ejecucion.tipo === 'java' && <EjecutorJava jar={ejecucion.jar} />}
              {ejecucion.tipo === 'python' && (
                <EjecutorPython archivos={ejecucion.archivos} principal={ejecucion.principal} />
              )}
              {ejecucion.tipo === 'camara' && <EjecutorCamara />}
              {ejecucion.tipo === 'codigo' && <EjecutorCodigo />}
              {ejecucion.tipo === 'cobol' && <EjecutorCobol />}
            </Suspense>
          </div>
          <aside className="ejecutor__ficha">
            <p className="ejecutor__resumen">{proyecto.resumen}</p>
            <ul className="ejecutor__detalle">
              {proyecto.detalle.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            {proyecto.nota && <p className="ejecutor__nota">{proyecto.nota}</p>}
          </aside>
        </div>
      </div>
    </div>
  )
}

export function Cargando({ texto, progreso }: { texto: string; progreso?: number }) {
  return (
    <div className="cargando" role="status">
      <span className="cargando__anillo" aria-hidden="true" />
      <p>{texto}</p>
      {progreso !== undefined && (
        <span className="cargando__barra" aria-hidden="true">
          <span style={{ transform: `scaleX(${progreso})` }} />
        </span>
      )}
    </div>
  )
}
