import { useEffect, useRef, useState } from 'react'
import { LogoAscii } from '../lib/logoAscii'
import { tecnologias, type Tecnologia } from '../data/tecnologias'
import { useIdioma } from '../lib/idioma'
import './Tecnologias.css'

interface FichaProps {
  tecnologia: Tecnologia
  activa: boolean
  apagada: boolean
  onActivar: (activa: boolean) => void
}

function Ficha({ tecnologia, activa, apagada, onActivar }: FichaProps) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const logo = useRef<LogoAscii | null>(null)
  const { t, tx } = useIdioma()

  useEffect(() => {
    logo.current = new LogoAscii(lienzo.current!, tecnologia.forma)
    return () => logo.current?.destruir()
  }, [tecnologia])

  useEffect(() => {
    logo.current?.resaltar(activa)
  }, [activa])

  return (
    <li className={`ficha${activa ? ' ficha--activa' : ''}${apagada ? ' ficha--apagada' : ''}`}>
      <button
        type="button"
        className="ficha__boton"
        onPointerEnter={(e) => e.pointerType === 'mouse' && onActivar(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onActivar(false)}
        onClick={() => onActivar(!activa)}
        onFocus={() => onActivar(true)}
        onBlur={() => onActivar(false)}
        aria-pressed={activa}
        aria-description={`${t('Usado en', 'Used in')}: ${tx(tecnologia.uso)}`}
      >
        <canvas ref={lienzo} className="ficha__logo" aria-hidden="true" />
        <span className="ficha__nombre">{tecnologia.nombre}</span>
      </button>
    </li>
  )
}

const todas = tecnologias.flatMap((g) => g.tecnologias.map((tec) => ({ tec, grupo: g.grupo.es })))

export default function Tecnologias() {
  const { t, tx } = useIdioma()
  // Solo una tecnología resaltada a la vez; dónde la he usado se lee en la cabecera
  const [activa, setActiva] = useState<Tecnologia | null>(null)
  // Todas en una sola rejilla; elegir un área apaga las demás sin mover nada
  const [grupo, setGrupo] = useState<string | null>(null)

  return (
    <div className="tecnologias" aria-labelledby="tecnologias-titulo">
      <div className="tecnologias__cabecera">
        <h3 id="tecnologias-titulo" className="etiqueta">
          {t('Con qué trabajo', 'What I work with')}
        </h3>
        <p className="tecnologias__pista" aria-live="polite">
          {activa ? (
            <>
              <strong>{activa.nombre}</strong> · {t('usado en', 'used in')} {tx(activa.uso)}
            </>
          ) : (
            <>
              <span className="solo-teclado">{t('Pasa el cursor por una tecnología para ver dónde la he usado', 'Hover a technology to see where I used it')}</span>
              <span className="solo-tactil">{t('Toca una tecnología para ver dónde la he usado', 'Tap a technology to see where I used it')}</span>
            </>
          )}
        </p>
      </div>
      <div className="tecnologias__grupos" role="group" aria-label={t('Filtrar por área', 'Filter by area')}>
        {[null, ...tecnologias].map((g) => {
          const nombre = g ? tx(g.grupo) : t('Todo', 'All')
          const elegido = (g?.grupo.es ?? null) === grupo
          return (
            <button
              key={nombre}
              type="button"
              className={`tecnologias__grupo${elegido ? ' tecnologias__grupo--activo' : ''}`}
              aria-pressed={elegido}
              onClick={() => setGrupo(g?.grupo.es ?? null)}
            >
              {nombre}
              <small>{g ? g.tecnologias.length : todas.length}</small>
            </button>
          )
        })}
      </div>
      <ul className="tecnologias__fichas">
        {todas.map(({ tec, grupo: suyo }) => (
          <Ficha
            key={tec.nombre}
            tecnologia={tec}
            activa={activa === tec}
            apagada={grupo !== null && suyo !== grupo}
            onActivar={(si) => setActiva((actual) => (si ? tec : actual === tec ? null : actual))}
          />
        ))}
      </ul>
    </div>
  )
}
