import { lazy, Suspense, useEffect, useState } from 'react'
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

// El ejecutor solo se descarga cuando alguien abre un proyecto
const Ejecutor = lazy(() => import('./components/ejecutor/Ejecutor'))

export default function App() {
  const [abierto, setAbierto] = useState<Proyecto | null>(null)
  const { idioma, t } = useIdioma()

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
        <Proyectos onEjecutar={setAbierto} />
        <GitHub />
        <Trayectoria />
        <Contacto />
      </main>
      <Paleta onEjecutar={setAbierto} />
      {abierto && (
        <Suspense fallback={null}>
          <Ejecutor proyecto={abierto} onCerrar={() => setAbierto(null)} />
        </Suspense>
      )}
    </>
  )
}
