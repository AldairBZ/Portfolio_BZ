import { useEffect, useRef } from 'react'
import { CapturaAscii } from '../lib/capturaAscii'
import { TerminalAscii } from '../lib/terminalAscii'
import type { Vista } from '../data/proyectos'
import { sesionBonGust } from '../data/bongust'

/** Lo que muestra la ventana de cada proyecto: su captura real o su terminal, en caracteres */
export default function VistaProyecto({ vista, alt, className }: { vista: Vista; alt: string; className?: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = lienzo.current!
    const motor =
      vista.tipo === 'captura'
        ? new CapturaAscii(canvas, vista.src, { recorrer: vista.recorrer, etiqueta: vista.src.split('/').pop()! })
        : new TerminalAscii(canvas, sesionBonGust)
    return () => motor.destruir()
  }, [vista])

  return <canvas ref={lienzo} className={className} role="img" aria-label={alt} />
}
