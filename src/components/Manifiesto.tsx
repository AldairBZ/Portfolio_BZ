import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import './Manifiesto.css'

const texto =
  'Escribo software que funciona y que se entiende. APIs con Java y Spring Boot o Node.js, interfaces con React, y la costumbre de probar lo que hago antes de darlo por terminado.'

const cifras = [
  { valor: '576 h', texto: 'de formación Full Stack con Java' },
  { valor: '2.º', texto: 'puesto en el Hackathon Tarragona 2025' },
  { valor: '4', texto: 'certificaciones de Microsoft Azure' },
]

export default function Manifiesto() {
  const raiz = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.manifiesto__palabra',
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: '.manifiesto__texto', start: 'top 80%', end: 'bottom 45%', scrub: true },
        },
      )
      gsap.fromTo(
        '.manifiesto__arco img',
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: raiz.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
      gsap.fromTo('.manifiesto__cifra', { y: 40, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        stagger: 0.12,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.manifiesto__cifras', start: 'top 85%' },
      })
    }, raiz)
    return () => ctx.revert()
  }, [])

  return (
    <section className="manifiesto" ref={raiz} aria-labelledby="manifiesto-titulo">
      <div className="manifiesto__rejilla">
        <figure className="manifiesto__arco">
          <img
            src="/arte/fuente-900.webp"
            alt="La fuente de la vida, del panel izquierdo de El jardín de las delicias"
            loading="lazy"
            width="900"
            height="2094"
          />
        </figure>
        <div>
          <h2 id="manifiesto-titulo" className="etiqueta">
            Sobre mí
          </h2>
          <p className="manifiesto__texto">
            {texto.split(' ').map((palabra, i) => (
              <span key={i} className="manifiesto__palabra">
                {palabra}{' '}
              </span>
            ))}
          </p>
          <p className="manifiesto__secundario">
            Busco mi primer puesto como desarrollador junior, en remoto o en híbrido desde Tarragona. Me adapto rápido a
            un equipo, pregunto cuando algo no está claro y dejo el código mejor de lo que lo encontré.
          </p>
          <ul className="manifiesto__cifras">
            {cifras.map((cifra) => (
              <li key={cifra.valor} className="manifiesto__cifra">
                <span className="manifiesto__valor">{cifra.valor}</span>
                <span className="manifiesto__desc">{cifra.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
