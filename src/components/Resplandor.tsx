import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { gsap } from '../lib/scroll'
import './Resplandor.css'

/*
 * Luz difusa detrás de un titular, del color de sus letras. Al bajar hasta él
 * se enciende con un destello y luego se queda tenue. Va dentro de un
 * contenedor con position: relative, detrás del texto.
 */
export default function Resplandor({ color }: { color: string }) {
  const luz = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = luz.current!
    const contexto = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: { trigger: el.parentElement, start: 'top 90%', end: 'center 35%', scrub: true },
        })
        .fromTo(el, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 0.95, scale: 1.15, ease: 'power2.in', duration: 0.55 })
        .to(el, { autoAlpha: 0.5, scale: 1, ease: 'power2.out', duration: 0.45 })
    })
    return () => contexto.revert()
  }, [])

  return <span ref={luz} className="resplandor" style={{ '--color-luz': color } as CSSProperties} aria-hidden="true" />
}
