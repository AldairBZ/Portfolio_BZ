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

// El ejecutor solo se descarga cuando alguien abre un proyecto
const Ejecutor = lazy(() => import('./components/ejecutor/Ejecutor'))

export default function App() {
  const [abierto, setAbierto] = useState<Proyecto | null>(null)

  useEffect(() => {
    // Las animaciones de la portada empiezan siempre desde arriba
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const parar = iniciarScroll()
    // Recalcula posiciones cuando terminan de cargar fuentes e imágenes
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
    return parar
  }, [])

  return (
    <>
      <a className="saltar" href="#proyectos">
        Saltar a los proyectos
      </a>
      <Cabecera />
      <main>
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
