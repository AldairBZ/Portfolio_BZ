import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import './Trayectoria.css'

const hitos = [
  {
    fecha: '2025',
    titulo: '2.º puesto · Hackathon Tarragona',
    texto:
      'En un equipo de cuatro programamos una solución con IA para agilizar trámites del Ajuntament, con modelos en local (Ollama) para que funcionara en un ordenador normal.',
    enlace: { href: 'https://github.com/FerdisJ/HackaTON', texto: 'Repositorio del equipo' },
  },
  {
    fecha: 'Feb – Ago 2025',
    titulo: 'Desenvolupament Web FullStack amb Java',
    texto:
      'Bootcamp de 576 horas en la Fundación Esplai: Java, POO, bases de datos SQL y MongoDB, Maven y JUnit, Spring, HTML, CSS, JavaScript y React. Proyecto final en equipo: LifeLevelUp.',
  },
  {
    fecha: 'Certificaciones',
    titulo: 'Microsoft Azure Fundamentals',
    texto: 'AZ-900, AI-900, DP-900 y SC-900. Y Java SE 11 Programming II, de La Salle.',
  },
]

const stack = [
  { grupo: 'Backend', items: ['Java', 'Spring Boot', 'Hibernate', 'Node.js', 'Express', 'REST', 'JWT', 'OAuth 2.0'] },
  { grupo: 'Frontend', items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vite'] },
  { grupo: 'Datos', items: ['MySQL', 'MongoDB', 'SQLite', 'JDBC'] },
  { grupo: 'Calidad y entrega', items: ['JUnit', 'Supertest', 'Maven', 'Git', 'GitHub Actions', 'Cloudflare', 'Azure'] },
]

export default function Trayectoria() {
  const raiz = useRef<HTMLElement>(null)

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
          <p className="etiqueta">Trayectoria</p>
          <h2 id="trayectoria-titulo" className="trayectoria__titulo">
            Aprender rápido,
            <br />
            <em>entregar código que funciona.</em>
          </h2>
        </header>

        <div className="trayectoria__hitos">
          <span className="trayectoria__linea" aria-hidden="true" />
          <ol className="trayectoria__lista">
          {hitos.map((hito) => (
            <li key={hito.titulo} className="hito">
              <p className="etiqueta hito__fecha">{hito.fecha}</p>
              <h3 className="hito__titulo">{hito.titulo}</h3>
              <p className="hito__texto">{hito.texto}</p>
              {hito.enlace && (
                <a className="hito__enlace" href={hito.enlace.href} target="_blank" rel="noreferrer">
                  {hito.enlace.texto} ↗
                </a>
              )}
            </li>
          ))}
          </ol>
        </div>

        </div>

        <div className="stack" aria-labelledby="stack-titulo">
          <h3 id="stack-titulo" className="etiqueta">
            Con qué trabajo
          </h3>
          <div className="stack__grupos">
            {stack.map((g) => (
              <div key={g.grupo} className="stack__grupo">
                <p className="stack__nombre">{g.grupo}</p>
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
