import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/scroll'
import VistaProyecto from './VistaProyecto'
import { proyectos, type Proyecto } from '../data/proyectos'
import { useIdioma, type Texto } from '../lib/idioma'
import { precargar } from '../lib/precarga'
import './Proyectos.css'

const textoBoton: Record<Proyecto['ejecucion']['tipo'], Texto> = {
  web: { es: 'Abrir aquí', en: 'Open here' },
  java: { es: 'Ejecutar Java', en: 'Run Java' },
  python: { es: 'Ejecutar Python', en: 'Run Python' },
  camara: { es: 'Probar con cámara', en: 'Try with camera' },
  codigo: { es: 'Ver el código', en: 'View code' },
  cobol: { es: 'Jugar en COBOL', en: 'Play in COBOL' },
}

interface Props {
  onEjecutar: (proyecto: Proyecto) => void
}

export default function Proyectos({ onEjecutar }: Props) {
  const raiz = useRef<HTMLElement>(null)
  const pista = useRef<HTMLDivElement>(null)
  const { t, tx } = useIdioma()

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(raiz)

    // En escritorio la galería avanza en horizontal mientras se hace scroll
    mm.add('(min-width: 900px)', () => {
      const el = pista.current!
      const seccion = raiz.current!
      const distancia = () => el.scrollWidth - window.innerWidth
      // La sección mide lo que dura el recorrido horizontal; dentro, la galería es sticky
      const ajustarAlto = () => {
        seccion.style.height = `${window.innerHeight + distancia()}px`
      }
      ajustarAlto()
      ScrollTrigger.addEventListener('refreshInit', ajustarAlto)
      const avance = gsap.to(el, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: {
          trigger: seccion,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      // Cada ventana se acerca recta, sin giros, mientras la galería avanza
      gsap.utils.toArray<HTMLElement>('.obra__ventana').forEach((ventana) => {
        gsap.fromTo(
          ventana,
          { scale: 0.9, autoAlpha: 0.35 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: ventana.closest('.obra'),
              containerAnimation: avance,
              start: 'left right',
              end: 'center center',
              scrub: true,
            },
          },
        )
      })
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', ajustarAlto)
        seccion.style.height = ''
      }
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
      <div className="proyectos__fijo">
      <div className="proyectos__pista" ref={pista}>
        <header className="proyectos__intro">
          <p className="etiqueta">
            {t('Proyectos', 'Projects')} · {String(proyectos.length).padStart(2, '0')}
          </p>
          <h2 id="proyectos-titulo" className="proyectos__titulo">
            {t('No te los enseño.', 'I don’t show them.')}
            <br />
            <em>{t('Los ejecutas.', 'You run them.')}</em>
          </h2>
          <p className="proyectos__texto">
            {t(
              'Java, Python, COBOL y JavaScript funcionando dentro de esta página, sin instalar nada. Pulsa en cualquier proyecto para abrirlo aquí mismo.',
              'Java, Python, COBOL and JavaScript running inside this page, nothing to install. Click any project to open it right here.',
            )}
          </p>
        </header>

        {proyectos.map((proyecto, i) => (
          <article key={proyecto.id} className="obra" aria-labelledby={`obra-${proyecto.id}`}>
            <figure className="obra__ventana">
              <figcaption className="obra__pestana">
                <span className="obra__puntos" aria-hidden="true" />
                <span className="obra__ruta">{proyecto.vista.pestana}</span>
              </figcaption>
              <VistaProyecto
                vista={proyecto.vista}
                alt={t(`Captura de ${tx(proyecto.nombre)}`, `Screenshot of ${tx(proyecto.nombre)}`, `Captura de ${tx(proyecto.nombre)}`)}
                className="obra__lienzo"
              />
            </figure>
            <div className="obra__info">
              <p className="etiqueta">
                {String(i + 1).padStart(2, '0')} / {String(proyectos.length).padStart(2, '0')}
              </p>
              <h3 id={`obra-${proyecto.id}`} className="obra__nombre">
                {tx(proyecto.nombre)}
              </h3>
              <p className="obra__resumen">{tx(proyecto.resumen)}</p>
              <ul className="obra__stack" aria-label={t('Tecnologías', 'Technologies')}>
                {proyecto.stack.map((tec) => (
                  <li key={tec}>{tec}</li>
                ))}
              </ul>
              <div className="obra__acciones">
                <button
                  type="button"
                  className="boton boton--lleno"
                  onClick={() => onEjecutar(proyecto)}
                  onPointerEnter={() => precargar(proyecto.ejecucion.tipo)}
                  onFocus={() => precargar(proyecto.ejecucion.tipo)}
                  onTouchStart={() => precargar(proyecto.ejecucion.tipo)}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
                  </svg>
                  {tx(textoBoton[proyecto.ejecucion.tipo])}
                </button>
                <a className="boton" href={proyecto.repo} target="_blank" rel="noreferrer">
                  {t('Código', 'Code')}
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  )
}
