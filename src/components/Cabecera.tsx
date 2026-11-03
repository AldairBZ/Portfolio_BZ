import { useEffect, useState } from 'react'
import { irA } from '../lib/scroll'
import './Cabecera.css'

const enlaces = [
  { href: '#proyectos', texto: 'Proyectos' },
  { href: '#trayectoria', texto: 'Trayectoria' },
  { href: '#contacto', texto: 'Contacto' },
]

export default function Cabecera() {
  const [compacta, setCompacta] = useState(false)

  useEffect(() => {
    const alScroll = () => setCompacta(window.scrollY > 40)
    alScroll()
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  const navegar = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    irA(href)
  }

  return (
    <header className={`cabecera${compacta ? ' cabecera--compacta' : ''}`}>
      <a className="cabecera__marca" href="#inicio" onClick={(e) => navegar(e, '#inicio')}>
        <span className="cabecera__monograma" aria-hidden="true">
          SB
        </span>
        <span className="cabecera__nombre">Scheneider Baltazar</span>
      </a>
      <nav aria-label="Principal">
        <ul className="cabecera__enlaces">
          {enlaces.map((enlace) => (
            <li key={enlace.href}>
              <a href={enlace.href} onClick={(e) => navegar(e, enlace.href)}>
                {enlace.texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a className="cabecera__estado" href="#contacto" onClick={(e) => navegar(e, '#contacto')}>
        <span className="cabecera__punto" aria-hidden="true" />
        Disponible
      </a>
    </header>
  )
}
