import { useLayoutEffect, useRef } from 'react'
import { gsap, irA, movimientoReducido } from '../lib/scroll'
import './Portada.css'

export default function Portada() {
  const raiz = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (movimientoReducido()) {
        // Con el movimiento reducido la entrada es solo un fundido
        gsap.fromTo('.portada__titulo, .portada__aparece, .portada__lienzo', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, stagger: 0.15 })
      } else {
        // Entrada: el nombre sube línea a línea y el cuadro se revela de abajo arriba
        gsap
          .timeline({ defaults: { ease: 'expo.out', duration: 1.6 } })
          .fromTo('.portada__linea > span', { yPercent: 110 }, { yPercent: 0, stagger: 0.12 }, 0.15)
          .fromTo('.portada__cuadro', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2 }, 0)
          .fromTo('.portada__lienzo', { scale: 1.25 }, { scale: 1, duration: 2.6 }, 0)
          .fromTo('.portada__aparece', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 1 }, 0.7)
      }

      // Scroll: la cámara entra en el cuadro y aparecen las líneas de construcción.
      // Lo controla quien hace scroll, así que se mantiene también con el movimiento reducido.
      const viaje = gsap.timeline({
        scrollTrigger: {
          trigger: raiz.current,
          start: 'top top',
          end: '+=140%',
          scrub: 1,
          pin: true,
        },
      })
      viaje
        .to('.portada__texto', { yPercent: -30, autoAlpha: 0, ease: 'none', duration: 0.5 }, 0)
        .to('.portada__lienzo', { scale: 2.6, yPercent: -6, ease: 'none', duration: 1 }, 0)
        .fromTo(
          '.portada__trazo',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, stagger: 0.05, ease: 'none', duration: 0.5 },
          0.2,
        )
        .fromTo('.portada__cota', { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.05, duration: 0.2 }, 0.45)
        .to('.portada__lienzo img', { filter: 'saturate(0.35) brightness(0.45)', ease: 'none', duration: 0.4 }, 0.6)
        .fromTo('.portada__frase', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.7)
    }, raiz)
    return () => ctx.revert()
  }, [])

  return (
    <section id="inicio" className="portada" ref={raiz}>
      <div className="portada__cuadro">
        <div className="portada__lienzo">
          <img
            src="/arte/horizonte-1600.webp"
            srcSet="/arte/horizonte-1600.webp 1600w, /arte/horizonte-2800.webp 2800w"
            sizes="(max-width: 900px) 260vw, 100vw"
            alt="Fuentes y torres fantásticas del panel central de El jardín de las delicias, de El Bosco"
            fetchPriority="high"
          />
          <svg className="portada__plano" viewBox="0 0 100 28.3" preserveAspectRatio="none" aria-hidden="true">
            <line className="portada__trazo" x1="52.2" y1="0" x2="52.2" y2="28.3" pathLength="1" />
            <line className="portada__trazo" x1="0" y1="16" x2="100" y2="16" pathLength="1" />
            <ellipse className="portada__trazo" cx="52.2" cy="26.4" rx="6.2" ry="5.2" pathLength="1" />
            <rect className="portada__trazo" x="47.6" y="3" width="9.2" height="21" pathLength="1" />
            <line className="portada__trazo" x1="22" y1="6" x2="52.2" y2="16" pathLength="1" />
            <line className="portada__trazo" x1="82" y1="6" x2="52.2" y2="16" pathLength="1" />
          </svg>
          <span className="portada__cota" style={{ left: '57.5%', top: '12%' }}>
            &lt;Fuente /&gt;
          </span>
          <span className="portada__cota" style={{ left: '57.5%', top: '20%' }}>
            h: 21rem
          </span>
          <span className="portada__cota" style={{ left: '22%', top: '18%' }}>
            render(jardín)
          </span>
          <span className="portada__cota" style={{ left: '58.5%', top: '84%' }}>
            border-radius: 50%
          </span>
        </div>
      </div>

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
        Cada pieza de un cuadro tiene su lugar.
        <br />
        <em>En el código, también.</em>
      </p>

      <p className="etiqueta portada__pista portada__aparece" aria-hidden="true">
        Desliza
      </p>
    </section>
  )
}
