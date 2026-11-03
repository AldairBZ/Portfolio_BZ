import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { proyectos, type Proyecto } from '../data/proyectos'
import './Proyectos.css'

const textoBoton: Record<Proyecto['ejecucion']['tipo'], string> = {
  web: 'Abrir aquí',
  java: 'Ejecutar Java',
  python: 'Ejecutar Python',
  camara: 'Probar con cámara',
  codigo: 'Ver el código',
}

interface Props {
  onEjecutar: (proyecto: Proyecto) => void
}

export default function Proyectos({ onEjecutar }: Props) {
  const raiz = useRef<HTMLElement>(null)
  const pista = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(raiz)

    // En escritorio la galería avanza en horizontal mientras se hace scroll
    mm.add('(min-width: 900px)', () => {
      const el = pista.current!
      const distancia = () => el.scrollWidth - window.innerWidth
      const avance = gsap.to(el, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: {
          trigger: raiz.current,
          start: 'top top',
          end: () => `+=${distancia()}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      })
      gsap.utils.toArray<HTMLElement>('.obra__arco img').forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -8 },
          {
            xPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: img.closest('.obra'),
              containerAnimation: avance,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        )
      })
    })

    mm.add('(max-width: 899px)', () => {
      gsap.utils.toArray<HTMLElement>('.obra').forEach((obra) => {
        gsap.fromTo(obra, { y: 60, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: obra, start: 'top 88%' },
        })
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <section id="proyectos" className="proyectos" ref={raiz} aria-labelledby="proyectos-titulo">
      <div className="proyectos__pista" ref={pista}>
        <header className="proyectos__intro">
          <p className="etiqueta">Proyectos · {String(proyectos.length).padStart(2, '0')}</p>
          <h2 id="proyectos-titulo" className="proyectos__titulo">
            No te los enseño.
            <br />
            <em>Los ejecutas.</em>
          </h2>
          <p className="proyectos__texto">
            Java, Python y JavaScript funcionando dentro de esta página, sin instalar nada. Pulsa en cualquier proyecto
            para abrirlo aquí mismo.
          </p>
        </header>

        {proyectos.map((proyecto, i) => (
          <article key={proyecto.id} className="obra" aria-labelledby={`obra-${proyecto.id}`}>
            <figure className="obra__arco">
              <img
                src={`/arte/${proyecto.fragmento}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </figure>
            <div className="obra__info">
              <p className="etiqueta">
                {String(i + 1).padStart(2, '0')} / {String(proyectos.length).padStart(2, '0')}
              </p>
              <h3 id={`obra-${proyecto.id}`} className="obra__nombre">
                {proyecto.nombre}
              </h3>
              <p className="obra__resumen">{proyecto.resumen}</p>
              <ul className="obra__stack" aria-label="Tecnologías">
                {proyecto.stack.map((tec) => (
                  <li key={tec}>{tec}</li>
                ))}
              </ul>
              <div className="obra__acciones">
                <button type="button" className="boton boton--lleno" onClick={() => onEjecutar(proyecto)}>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
                  </svg>
                  {textoBoton[proyecto.ejecucion.tipo]}
                </button>
                <a className="boton" href={proyecto.repo} target="_blank" rel="noreferrer">
                  Código
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
