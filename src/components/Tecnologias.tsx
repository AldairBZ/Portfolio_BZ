import { useEffect, useRef, useState } from 'react'
import { LogoAscii } from '../lib/logoAscii'
import { tecnologias, type Tecnologia } from '../data/tecnologias'
import { useIdioma } from '../lib/idioma'
import './Tecnologias.css'

function Ficha({ tecnologia }: { tecnologia: Tecnologia }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const logo = useRef<LogoAscii | null>(null)
  const [activa, setActiva] = useState(false)
  const { t, tx } = useIdioma()

  useEffect(() => {
    logo.current = new LogoAscii(lienzo.current!, tecnologia.forma)
    return () => logo.current?.destruir()
  }, [tecnologia])

  useEffect(() => {
    logo.current?.resaltar(activa)
  }, [activa])

  return (
    <li className={`ficha${activa ? ' ficha--activa' : ''}`}>
      <button
        type="button"
        className="ficha__boton"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setActiva(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActiva(false)}
        onClick={() => setActiva((a) => !a)}
        onBlur={() => setActiva(false)}
        aria-expanded={activa}
      >
        <canvas ref={lienzo} className="ficha__logo" aria-hidden="true" />
        <span className="ficha__nombre">{tecnologia.nombre}</span>
        <span className="ficha__uso">
          <span>
            <span className="sr-only">{t('Usado en', 'Used in')}: </span>
            {tx(tecnologia.uso)}
          </span>
        </span>
      </button>
    </li>
  )
}

export default function Tecnologias() {
  const { t, tx } = useIdioma()

  return (
    <div className="tecnologias" aria-labelledby="tecnologias-titulo">
      <div className="tecnologias__cabecera">
        <h3 id="tecnologias-titulo" className="etiqueta">
          {t('Con qué trabajo', 'What I work with')}
        </h3>
        <p className="tecnologias__pista">
          <span className="solo-teclado">{t('Pasa el cursor por una tecnología para ver dónde la he usado', 'Hover a technology to see where I used it')}</span>
          <span className="solo-tactil">{t('Toca una tecnología para ver dónde la he usado', 'Tap a technology to see where I used it')}</span>
        </p>
      </div>
      {tecnologias.map((g) => (
        <section key={g.grupo.es} className="tecnologias__grupo" aria-label={tx(g.grupo)}>
          <p className="tecnologias__nombre">{tx(g.grupo)}</p>
          <ul className="tecnologias__fichas">
            {g.tecnologias.map((tec) => (
              <Ficha key={tec.nombre} tecnologia={tec} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
