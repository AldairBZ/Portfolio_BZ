import { lazy, Suspense, useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { RetratoAscii } from '../lib/retrato'
import { useIdioma } from '../lib/idioma'
import './Retrato.css'

const PanelVisitas = lazy(() => import('./PanelVisitas'))

// La oreja en retrato.webp (550 x 640), en proporción: ahí se esconde el panel de visitas
const OREJA = { x: 0.6, y: 0.3, ancho: 0.13, alto: 0.16 }

export default function Retrato() {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const [panel, setPanel] = useState(false)
  const { t } = useIdioma()
  const cerrar = useCallback(() => setPanel(false), [])

  useEffect(() => {
    const retrato = new RetratoAscii(lienzo.current!, '/retrato/retrato.webp')
    return () => retrato.destruir()
  }, [])

  const alPulsar = (e: MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - OREJA.x
    const y = (e.clientY - r.top) / r.height - OREJA.y
    if (x >= 0 && x <= OREJA.ancho && y >= 0 && y <= OREJA.alto) setPanel(true)
  }

  return (
    <figure className="retrato">
      <canvas
        ref={lienzo}
        className="retrato__lienzo"
        role="img"
        aria-label={t('Retrato de Scheneider Baltazar dibujado con caracteres', 'Portrait of Scheneider Baltazar drawn with characters')}
        onClick={alPulsar}
      />
      <figcaption className="retrato__pie">
        <span>Scheneider Baltazar</span>
        <span className="retrato__pista">
          <span className="solo-teclado">{t('Pasa el cursor: debajo está la foto', 'Hover: the photo is underneath')}</span>
          <span className="solo-tactil">{t('Toca el retrato para ver la foto', 'Touch the portrait to see the photo')}</span>
        </span>
      </figcaption>
      {/* En <body>: un ancestro con transform rompería position: fixed */}
      {panel &&
        createPortal(
          <Suspense fallback={null}>
            <PanelVisitas onCerrar={cerrar} />
          </Suspense>,
          document.body,
        )}
    </figure>
  )
}
