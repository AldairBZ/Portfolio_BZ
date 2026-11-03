import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const movimientoReducido = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

/** Scroll suave con Lenis sincronizado con ScrollTrigger. Sin él si el usuario reduce las animaciones. */
export function iniciarScroll() {
  if (lenis || movimientoReducido()) return () => {}

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (tiempo: number) => lenis?.raf(tiempo * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function irA(destino: string | HTMLElement) {
  if (lenis) lenis.scrollTo(destino, { offset: 0, duration: 1.4 })
  else {
    const el = typeof destino === 'string' ? document.querySelector(destino) : destino
    el?.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth' })
  }
}

/** Detiene el scroll de la página mientras hay una ventana abierta encima */
export function bloquearScroll(bloquear: boolean) {
  if (lenis) {
    if (bloquear) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = bloquear ? 'hidden' : ''
}

export { gsap, ScrollTrigger }
