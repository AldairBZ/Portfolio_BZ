import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { useIdioma, type Texto } from '../lib/idioma'
import './Trayectoria.css'

const mismo = (texto: string): Texto => ({ es: texto, en: texto })

const hitos = [
  {
    fecha: mismo('2025'),
    titulo: { es: '2.º puesto · Hackathon Tarragona', en: '2nd place · Hackathon Tarragona' },
    texto: {
      es: 'En un equipo de cuatro programamos una solución con IA para agilizar trámites del Ajuntament, con modelos en local (Ollama) para que funcionara en un ordenador normal.',
      en: 'In a team of four we built an AI solution to speed up City Council procedures, with local models (Ollama) so it could run on an ordinary computer.',
    },
    enlace: { href: 'https://github.com/FerdisJ/HackaTON', texto: { es: 'Repositorio del equipo', en: 'Team repository' } },
  },
  {
    fecha: { es: 'Feb – Ago 2025', en: 'Feb – Aug 2025' },
    titulo: mismo('Desenvolupament Web FullStack amb Java'),
    texto: {
      es: 'Bootcamp de 576 horas en la Fundación Esplai: Java, POO, bases de datos SQL y MongoDB, Maven y JUnit, Spring, HTML, CSS, JavaScript y React. Proyecto final en equipo: LifeLevelUp.',
      en: '576-hour bootcamp at Fundación Esplai: Java, OOP, SQL databases and MongoDB, Maven and JUnit, Spring, HTML, CSS, JavaScript and React. Team final project: LifeLevelUp.',
    },
  },
  {
    fecha: { es: 'Certificaciones', en: 'Certifications' },
    titulo: mismo('Microsoft Azure Fundamentals'),
    texto: {
      es: 'AZ-900, AI-900, DP-900 y SC-900. Y Java SE 11 Programming II, de La Salle.',
      en: 'AZ-900, AI-900, DP-900 and SC-900. Plus Java SE 11 Programming II, from La Salle.',
    },
  },
]

const stack = [
  { grupo: mismo('Backend'), items: ['Java', 'Spring Boot', 'Hibernate', 'Node.js', 'Express', 'REST', 'JWT', 'OAuth 2.0'] },
  { grupo: mismo('Frontend'), items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vite'] },
  { grupo: { es: 'Datos', en: 'Data' }, items: ['MySQL', 'MongoDB', 'SQLite', 'JDBC'] },
  {
    grupo: { es: 'Calidad y entrega', en: 'Quality & delivery' },
    items: ['JUnit', 'Supertest', 'Maven', 'Git', 'GitHub Actions', 'Cloudflare', 'Azure'],
  },
]

export default function Trayectoria() {
  const raiz = useRef<HTMLElement>(null)
  const { t, tx } = useIdioma()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.hito').forEach((hito) => {
        gsap.fromTo(hito, { y: 50, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: hito, start: 'top 88%' },
        })
      })
      gsap.fromTo('.trayectoria__linea', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.trayectoria__hitos', start: 'top 75%', end: 'bottom 60%', scrub: true },
      })
    }, raiz)
    return () => ctx.revert()
  }, [])

  return (
    <section id="trayectoria" className="trayectoria" ref={raiz} aria-labelledby="trayectoria-titulo">
      <div className="trayectoria__contenido">
        <div className="trayectoria__principal">
        <header>
          <p className="etiqueta">{t('Trayectoria', 'Experience')}</p>
          <h2 id="trayectoria-titulo" className="trayectoria__titulo">
            {t('Aprender rápido,', 'Learn fast,')}
            <br />
            <em>{t('entregar código que funciona.', 'ship code that works.')}</em>
          </h2>
        </header>

        <div className="trayectoria__hitos">
          <span className="trayectoria__linea" aria-hidden="true" />
          <ol className="trayectoria__lista">
          {hitos.map((hito) => (
            <li key={hito.titulo.es} className="hito">
              <p className="etiqueta hito__fecha">{tx(hito.fecha)}</p>
              <h3 className="hito__titulo">{tx(hito.titulo)}</h3>
              <p className="hito__texto">{tx(hito.texto)}</p>
              {hito.enlace && (
                <a className="hito__enlace" href={hito.enlace.href} target="_blank" rel="noreferrer">
                  {tx(hito.enlace.texto)} ↗
                </a>
              )}
            </li>
          ))}
          </ol>
        </div>

        </div>

        <div className="stack" aria-labelledby="stack-titulo">
          <h3 id="stack-titulo" className="etiqueta">
            {t('Con qué trabajo', 'What I work with')}
          </h3>
          <div className="stack__grupos">
            {stack.map((g) => (
              <div key={g.grupo.es} className="stack__grupo">
                <p className="stack__nombre">{tx(g.grupo)}</p>
                <ul>
                  {g.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
