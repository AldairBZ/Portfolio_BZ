import { useEffect, useRef } from 'react'
import { RetratoAscii } from '../lib/retrato'
import { useIdioma } from '../lib/idioma'
import './Retrato.css'

export default function Retrato() {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const { t } = useIdioma()

  useEffect(() => {
    const retrato = new RetratoAscii(lienzo.current!, '/retrato/retrato.webp')
    return () => retrato.destruir()
  }, [])

  return (
    <figure className="retrato">
      <canvas
        ref={lienzo}
        className="retrato__lienzo"
        role="img"
        aria-label={t('Retrato de Scheneider Baltazar dibujado con caracteres', 'Portrait of Scheneider Baltazar drawn with characters')}
      />
      <figcaption className="retrato__pie">
        <span>Scheneider Baltazar</span>
        <span className="retrato__pista">
          <span className="solo-teclado">{t('Pasa el cursor: debajo está la foto', 'Hover: the photo is underneath')}</span>
          <span className="solo-tactil">{t('Toca el retrato para ver la foto', 'Touch the portrait to see the photo')}</span>
        </span>
      </figcaption>
    </figure>
  )
}
