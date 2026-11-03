import { useEffect, useId, useRef, useState } from 'react'
import { CVS } from '../lib/cv'
import { useIdioma } from '../lib/idioma'
import './BotonCv.css'

/** Botón «Descargar CV» que pregunta en qué idioma: castellano, catalán o inglés */
export default function BotonCv({ flecha = '' }: { flecha?: string }) {
  const [abierto, setAbierto] = useState(false)
  // Si no cabe debajo del botón (en el móvil suele pasar), se abre hacia arriba
  const [arriba, setArriba] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const id = useId()
  const { t, idioma } = useIdioma()

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  return (
    <div className="boton-cv" ref={raiz}>
      <button
        type="button"
        className="boton"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={(e) => {
          setArriba(e.currentTarget.getBoundingClientRect().bottom + 200 > window.innerHeight)
          setAbierto((a) => !a)
        }}
      >
        {t('Descargar CV', 'Download CV')}
        {flecha && ` ${flecha}`}
      </button>
      {abierto && (
        <div className={`boton-cv__menu${arriba ? ' boton-cv__menu--arriba' : ''}`} id={id} role="menu" aria-label={t('Idioma del CV', 'CV language')}>
          <p>{t('¿En qué idioma?', 'Which language?')}</p>
          {/* El idioma de la web va primero */}
          {[...CVS].sort((a, b) => Number(b.idioma === idioma) - Number(a.idioma === idioma)).map((cv) => (
            <a key={cv.idioma} role="menuitem" href={cv.ruta} download lang={cv.idioma} onClick={() => setAbierto(false)}>
              {cv.nombre}
              <small>PDF</small>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
