import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { CVS } from '../lib/cv'
import { useIdioma } from '../lib/idioma'
import './BotonCv.css'

/** Botón «Descargar CV» que pregunta en qué idioma: castellano, catalán o inglés */
export default function BotonCv({ flecha = '' }: { flecha?: string }) {
  const [abierto, setAbierto] = useState(false)
  // Si no cabe debajo del botón (en el móvil suele pasar), se abre hacia arriba
  const [arriba, setArriba] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  const { t, idioma } = useIdioma()

  // Se mide el menú ya abierto: si se sale por abajo, se abre hacia arriba antes de pintarse.
  // Medio cortado obligaba a hacer scroll, y el scroll mueve la portada (y el menú con ella).
  useLayoutEffect(() => {
    const m = menu.current
    if (abierto && !arriba && m && m.getBoundingClientRect().bottom > window.innerHeight - 8) setArriba(true)
  }, [abierto, arriba])

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
        <div ref={menu} className={`boton-cv__menu${arriba ? ' boton-cv__menu--arriba' : ''}`} id={id} role="menu" aria-label={t('Idioma del CV', 'CV language')}>
          <p>{t('¿En qué idioma?', 'Which language?')}</p>
          {/* El idioma de la web va primero */}
          {[...CVS].sort((a, b) => Number(b.idioma === idioma) - Number(a.idioma === idioma)).map((cv) => (
            // El menú se cierra después del clic, no durante: si React quita el enlace antes de que el
            // navegador lo siga, la descarga a veces no empieza.
            <a key={cv.idioma} role="menuitem" href={cv.ruta} download lang={cv.idioma} onClick={() => setTimeout(() => setAbierto(false))}>
              {cv.nombre}
              <small>PDF</small>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
