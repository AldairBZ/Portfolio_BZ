import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Cabecera from './components/Cabecera'
import Portada from './components/Portada'
import Manifiesto from './components/Manifiesto'
import Proyectos from './components/Proyectos'
import GitHub from './components/GitHub'
import Trayectoria from './components/Trayectoria'
import Paleta from './components/Paleta'
import Contacto from './components/Contacto'
import { iniciarScroll, ScrollTrigger } from './lib/scroll'
import type { Proyecto } from './data/proyectos'
import { useIdioma } from './lib/idioma'
import { escucharClics, registrar } from './lib/analitica'

// El ejecutor solo se descarga cuando alguien abre un proyecto
const Ejecutor = lazy(() => import('./components/ejecutor/Ejecutor'))

export default function App() {
  const [abierto, setAbierto] = useState<Proyecto | null>(null)
  const { idioma, t } = useIdioma()

  const ejecutar = useCallback((proyecto: Proyecto) => {
    registrar('ejecutar', proyecto.id)
    setAbierto(proyecto)
  }, [])
  // Estable entre renders: si cambiara, la ventana abierta volvería a bloquear el scroll y a robar el foco
  const cerrar = useCallback(() => setAbierto(null), [])

  // Visita, hasta qué sección llega (una vez por sección) y cada clic
  useEffect(() => {
    registrar('visita')
    const vistas = new Set<string>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting || vistas.has(e.target.id)) continue
          vistas.add(e.target.id)
          registrar('seccion', e.target.id)
        }
      },
      { threshold: 0.3 },
    )
    for (const id of ['proyectos', 'trayectoria', 'contacto']) {
      const el = document.getElementById(id)
      if (el) observador.observe(el)
    }
    const dejarDeEscuchar = escucharClics()
    return () => {
      observador.disconnect()
      dejarDeEscuchar()
    }
  }, [])

  useEffect(() => {
    // Las animaciones de la portada empiezan siempre desde arriba
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const parar = iniciarScroll()

    // Las secciones fijadas (pin) añaden altura: se ordenan por su posición en la página
    // y se recalculan cuando cambia la altura del documento (fuentes, datos de GitHub…)
    let altoAnterior = 0
    let espera = 0
    const recalcular = () => {
      ScrollTrigger.sort()
      ScrollTrigger.refresh()
      altoAnterior = document.body.scrollHeight
    }
    const primera = requestAnimationFrame(recalcular)
    const observador = new ResizeObserver(() => {
      if (Math.abs(document.body.scrollHeight - altoAnterior) < 2) return
      clearTimeout(espera)
      espera = window.setTimeout(recalcular, 150)
    })
    observador.observe(document.body)
    document.fonts?.ready.then(recalcular)

    return () => {
      parar()
      cancelAnimationFrame(primera)
      clearTimeout(espera)
      observador.disconnect()
    }
  }, [])

  return (
    <>
      <a className="saltar" href="#proyectos">
        {t('Saltar a los proyectos', 'Skip to projects')}
      </a>
      <Cabecera />
      {/* Al cambiar de idioma se vuelven a montar las secciones para rehacer sus animaciones */}
      <main key={idioma}>
        <Portada />
        <Manifiesto />
        <Proyectos onEjecutar={ejecutar} />
        <GitHub />
        <Trayectoria />
        <Contacto />
      </main>
      <Paleta onEjecutar={ejecutar} />
      {abierto && (
        <Suspense fallback={null}>
          <Ejecutor proyecto={abierto} onCerrar={cerrar} />
        </Suspense>
      )}
    </>
  )
}
