import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { bloquearScroll } from '../../lib/scroll'
import type { Proyecto } from '../../data/proyectos'
import { useIdioma, type Texto } from '../../lib/idioma'
import './Ejecutor.css'
import './Ejecutores.css'

const EjecutorWeb = lazy(() => import('./EjecutorWeb'))
const EjecutorJava = lazy(() => import('./EjecutorJava'))
const EjecutorPython = lazy(() => import('./EjecutorPython'))
const EjecutorCamara = lazy(() => import('./EjecutorCamara'))
const EjecutorCodigo = lazy(() => import('./EjecutorCodigo'))
const EjecutorCobol = lazy(() => import('./EjecutorCobol'))

const etiquetas: Record<Proyecto['ejecucion']['tipo'], Texto> = {
  web: { es: 'Aplicación web', en: 'Web app' },
  java: { es: 'Java en el navegador', en: 'Java in the browser' },
  python: { es: 'Python en el navegador', en: 'Python in the browser' },
  camara: { es: 'Visión por computador', en: 'Computer vision' },
  codigo: { es: 'Código fuente', en: 'Source code' },
  cobol: { es: 'COBOL en el navegador', en: 'COBOL in the browser' },
}

interface Props {
  proyecto: Proyecto
  onCerrar: () => void
}

export default function Ejecutor({ proyecto, onCerrar }: Props) {
  const dialogo = useRef<HTMLDivElement>(null)
  const { ejecucion } = proyecto
  const { t, tx } = useIdioma()
  // En el móvil la ficha empieza plegada para dejar todo el espacio al proyecto
  const [info, setInfo] = useState(false)

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
            <p className="etiqueta">{tx(etiquetas[ejecucion.tipo])}</p>
            <h2 id="ejecutor-titulo" className="ejecutor__titulo">
              {tx(proyecto.nombre)}
            </h2>
          </div>
          <div className="ejecutor__botones">
            {proyecto.demo && (
              <a className="boton ejecutor__extra" href={proyecto.demo} target="_blank" rel="noreferrer">
                {t('Pestaña nueva', 'New tab')} ↗
              </a>
            )}
            <a className="boton ejecutor__extra" href={proyecto.repo} target="_blank" rel="noreferrer">
              {t('Código', 'Code')} ↗
            </a>
            <button type="button" className="boton ejecutor__cerrar" onClick={onCerrar} aria-label={t('Cerrar', 'Close')}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </header>

        <div className="ejecutor__cuerpo">
          <div className="ejecutor__escena">
            <Suspense fallback={<Cargando texto={t('Preparando el entorno…', 'Preparing the environment…')} />}>
              {ejecucion.tipo === 'web' && <EjecutorWeb url={ejecucion.url} titulo={tx(proyecto.nombre)} />}
              {ejecucion.tipo === 'java' && <EjecutorJava jar={ejecucion.jar} />}
              {ejecucion.tipo === 'python' && (
                <EjecutorPython archivos={ejecucion.archivos} principal={ejecucion.principal} />
              )}
              {ejecucion.tipo === 'camara' && <EjecutorCamara />}
              {ejecucion.tipo === 'codigo' && <EjecutorCodigo />}
              {ejecucion.tipo === 'cobol' && <EjecutorCobol />}
            </Suspense>
          </div>
          <button
            type="button"
            className="ejecutor__info"
            aria-expanded={info}
            aria-controls="ejecutor-ficha"
            onClick={() => setInfo((v) => !v)}
          >
            {info ? t('Ocultar detalles', 'Hide details') : t('Ver detalles del proyecto', 'Show project details')}
            <span aria-hidden="true">{info ? '↓' : '↑'}</span>
          </button>
          <aside id="ejecutor-ficha" className={`ejecutor__ficha${info ? ' ejecutor__ficha--abierta' : ''}`}>
            <p className="ejecutor__resumen">{tx(proyecto.resumen)}</p>
            <ul className="ejecutor__detalle">
              {proyecto.detalle.map((d) => (
                <li key={d.es}>{tx(d)}</li>
              ))}
            </ul>
            {proyecto.nota && <p className="ejecutor__nota">{tx(proyecto.nota)}</p>}
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
