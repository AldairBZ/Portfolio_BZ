import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import CodigoVivo from './CodigoVivo'
import Retrato from './Retrato'
import { useIdioma } from '../lib/idioma'
import './Manifiesto.css'

const texto = {
  es: 'Escribo software que funciona y que se entiende. APIs con Java y Spring Boot o Node.js, interfaces con React, y la costumbre de probar lo que hago antes de darlo por terminado.',
  en: 'I write software that works and that makes sense. APIs with Java and Spring Boot or Node.js, interfaces with React, and the habit of testing what I build before calling it done.',
}

const cifras = [
  { valor: '576 h', texto: { es: 'de formación Full Stack con Java', en: 'of Full Stack training with Java' } },
  { valor: { es: '2.º', en: '2nd' }, texto: { es: 'puesto en el Hackathon Tarragona 2025', en: 'place at Hackathon Tarragona 2025' } },
  { valor: '4', texto: { es: 'certificaciones de Microsoft Azure', en: 'Microsoft Azure certifications' } },
]

export default function Manifiesto() {
  const raiz = useRef<HTMLElement>(null)
  const { t, tx } = useIdioma()

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
        <div className="manifiesto__lateral">
          <Retrato />
        </div>
        <div>
          <h2 id="manifiesto-titulo" className="etiqueta">
            {t('Sobre mí', 'About me')}
          </h2>
          <p className="manifiesto__texto">
            {tx(texto).split(' ').map((palabra, i) => (
              <span key={i} className="manifiesto__palabra">
                {palabra}{' '}
              </span>
            ))}
          </p>
          <p className="manifiesto__secundario">
            {t(
              'Busco mi primer puesto como desarrollador junior, en remoto o en híbrido desde Tarragona. Me adapto rápido a un equipo, pregunto cuando algo no está claro y dejo el código mejor de lo que lo encontré.',
              'I am looking for my first role as a junior developer, remote or hybrid from Tarragona. I adapt quickly to a team, ask when something is unclear and leave the code better than I found it.',
            )}
          </p>
          <ul className="manifiesto__cifras">
            {cifras.map((cifra) => (
              <li key={cifra.texto.es} className="manifiesto__cifra">
                <span className="manifiesto__valor">{typeof cifra.valor === 'string' ? cifra.valor : tx(cifra.valor)}</span>
                <span className="manifiesto__desc">{tx(cifra.texto)}</span>
              </li>
            ))}
          </ul>
          <div className="manifiesto__codigo">
            <CodigoVivo />
          </div>
        </div>
      </div>
    </section>
  )
}
