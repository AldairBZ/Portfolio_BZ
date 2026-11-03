import { useEffect, useRef } from 'react'
import { RetratoAscii } from '../lib/retrato'
import './Retrato.css'

export default function Retrato() {
  const lienzo = useRef<HTMLCanvasElement>(null)

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
        aria-label="Retrato de Scheneider Baltazar dibujado con caracteres"
      />
      <figcaption className="retrato__pie">
        <span>Scheneider Baltazar</span>
        <span className="retrato__pista">
          <span className="solo-teclado">Pasa el cursor: debajo está la foto</span>
          <span className="solo-tactil">Toca el retrato para ver la foto</span>
        </span>
      </figcaption>
    </figure>
  )
}
