import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import './Pintura.css'

export default function Pintura() {
  const raiz = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pintura__fondo img',
        { scale: 1.25, yPercent: -6 },
        {
          scale: 1,
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: raiz.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
      gsap.fromTo('.pintura__texto > *', { y: 40, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        stagger: 0.1,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.pintura__texto', start: 'top 80%' },
      })
    }, raiz)
    return () => ctx.revert()
  }, [])

  return (
    <section className="pintura" ref={raiz} aria-labelledby="pintura-titulo">
      <figure className="pintura__fondo">
        <img
          src="/arte/infierno-1600.webp"
          alt="Ciudad en llamas del panel derecho de El jardín de las delicias"
          loading="lazy"
          decoding="async"
        />
      </figure>
      <div className="pintura__texto">
        <p className="etiqueta">Un extra</p>
        <h2 id="pintura-titulo" className="pintura__titulo">
          Antes del código,
          <br />
          <em>pintaba.</em>
        </h2>
        <p>
          Fui ilustrador digital y mi terreno favorito era el surrealismo, con El Bosco como referencia. Hoy me dedico a
          programar, pero el ojo para el detalle viene de ahí, y me sirve cada vez que una interfaz tiene que entenderse
          a la primera.
        </p>
        <p className="pintura__credito">
          Las imágenes de esta web son fragmentos de <cite>El jardín de las delicias</cite> (El Bosco, c. 1490–1500),
          Museo del Prado. Obra de dominio público.
        </p>
      </div>
    </section>
  )
}
