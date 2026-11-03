import { useLayoutEffect, useRef } from 'react'
import { gsap, irA, movimientoReducido } from '../lib/scroll'
import { PlanetaAscii } from '../lib/ascii'
import './Portada.css'

export default function Portada() {
  const raiz = useRef<HTMLElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const movil = window.matchMedia('(max-width: 760px)').matches
    const medio = !movil && window.innerWidth < 1200
    // En pantallas estrechas el planeta baja para no tapar el texto
    const planeta = new PlanetaAscii(lienzo.current!, {
      celda: movil ? 9 : 12,
      radio: movil ? 0.36 : medio ? 0.3 : 0.34,
      centroX: movil ? 0.5 : medio ? 0.68 : 0.7,
      centroY: movil ? 0.74 : medio ? 0.7 : 0.56,
    })
    if (movimientoReducido()) planeta.estado.velocidad = 0.4

    // El ratón mueve la luz y la inclinación del planeta
    const alMover = (e: PointerEvent) => {
      gsap.to(planeta.estado, {
        inclinacionX: (e.clientX / window.innerWidth - 0.5) * 0.9,
        inclinacionY: (e.clientY / window.innerHeight - 0.5) * 0.25,
        duration: 1.2,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
    window.addEventListener('pointermove', alMover)

    const ctx = gsap.context(() => {
      if (movimientoReducido()) {
        gsap.fromTo('.portada__titulo, .portada__aparece', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, stagger: 0.15 })
      } else {
        gsap
          .timeline({ defaults: { ease: 'expo.out', duration: 1.6 } })
          .fromTo('.portada__linea > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.12 }, 0.15)
          .fromTo('.portada__aparece', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 1 }, 0.6)
          .fromTo(planeta.estado, { zoom: 0.2, velocidad: 14 }, { zoom: 1, velocidad: 1, duration: 2.8 }, 0)
      }

      // Scroll: el planeta se centra, crece y la portada da paso al mensaje
      gsap
        .timeline({
          scrollTrigger: { trigger: raiz.current, start: 'top top', end: '+=130%', scrub: 1, pin: true },
        })
        .to('.portada__texto', { yPercent: -25, autoAlpha: 0, ease: 'none', duration: 0.45 }, 0)
        .to(planeta.opciones, { centroX: 0.5, centroY: 0.5, ease: 'none', duration: 0.6 }, 0)
        .to(planeta.estado, { zoom: movil ? 2.2 : 2.9, velocidad: 3, ease: 'none', duration: 1 }, 0)
        .to(planeta.estado, { brillo: 0.32, ease: 'none', duration: 0.4 }, 0.55)
        .fromTo('.portada__frase', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.62)
    }, raiz)

    return () => {
      ctx.revert()
      planeta.destruir()
      window.removeEventListener('pointermove', alMover)
    }
  }, [])

  return (
    <section id="inicio" className="portada" ref={raiz}>
      <canvas className="portada__lienzo" ref={lienzo} aria-hidden="true" />

      <div className="portada__texto">
        <p className="etiqueta portada__aparece">Desarrollador Full Stack · Tarragona</p>
        <h1 className="portada__titulo">
          <span className="portada__linea">
            <span>Scheneider</span>
          </span>
          <span className="portada__linea">
            <span>
              <em>Baltazar</em>
            </span>
          </span>
        </h1>
        <div className="portada__lateral">
          <p className="portada__intro portada__aparece">
            Construyo aplicaciones web de principio a fin: APIs con Java, Spring Boot y Node.js, e interfaces con
            React. Mis proyectos se ejecutan aquí mismo, en tu navegador.
          </p>
          <div className="portada__acciones portada__aparece">
            <a
              className="boton boton--lleno"
              href="#proyectos"
              onClick={(e) => {
                e.preventDefault()
                irA('#proyectos')
              }}
            >
              Ver proyectos
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2v12m0 0 5-5m-5 5-5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </a>
            <a className="boton" href="https://github.com/AldairBZ" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </div>

      <p className="portada__frase">
        Este planeta no es una imagen.
        <br />
        <em>Son caracteres recalculados 60 veces por segundo.</em>
      </p>

      <p className="etiqueta portada__pista portada__aparece" aria-hidden="true">
        Pulsa <kbd>Ctrl</kbd> + <kbd>K</kbd>
      </p>
    </section>
  )
}
