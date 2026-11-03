import { useEffect, useRef } from 'react'
import { escenas, type NombreEscena } from '../lib/escenas'
import { PlanetaAscii } from '../lib/ascii'

/** Canvas que dibuja una escena generativa solo mientras está a la vista */
export default function Ilustracion({ escena, className }: { escena: NombreEscena; className?: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = lienzo.current!

    if (escena === 'planeta') {
      const planeta = new PlanetaAscii(canvas, {
        celda: 8,
        radio: 0.3,
        colorTierra: '#a9c4b1',
        colorMar: '#5f8fc4',
        colorAnillo: '#e9b7a6',
      })
      return () => planeta.destruir()
    }

    const ctx = canvas.getContext('2d')!
    const dibujar = escenas[escena]()
    let cuadro = 0
    let anterior = 0
    let visible = false

    const pintar = (tiempo: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const ancho = canvas.clientWidth
      const alto = canvas.clientHeight
      if (canvas.width !== Math.round(ancho * dpr) || canvas.height !== Math.round(alto * dpr)) {
        canvas.width = Math.round(ancho * dpr)
        canvas.height = Math.round(alto * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const dt = anterior ? Math.min(tiempo - anterior, 50) : 16
      anterior = tiempo
      dibujar(ctx, ancho, alto, dt)
      cuadro = visible ? requestAnimationFrame(pintar) : 0
    }

    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting
      if (visible && !cuadro) {
        anterior = 0
        cuadro = requestAnimationFrame(pintar)
      }
    })
    observador.observe(canvas)
    return () => {
      observador.disconnect()
      cancelAnimationFrame(cuadro)
    }
  }, [escena])

  return <canvas ref={lienzo} className={className} aria-hidden="true" />
}
