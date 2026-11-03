import { useEffect, useState } from 'react'
import { irA } from '../lib/scroll'
import { useIdioma } from '../lib/idioma'
import './Cabecera.css'

const enlaces = [
  { href: '#proyectos', texto: { es: 'Proyectos', en: 'Projects' } },
  { href: '#trayectoria', texto: { es: 'Trayectoria', en: 'Experience' } },
  { href: '#contacto', texto: { es: 'Contacto', en: 'Contact' } },
]

export default function Cabecera() {
  const [compacta, setCompacta] = useState(false)
  const { idioma, cambiar, t, tx } = useIdioma()

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
      <nav aria-label={t('Principal', 'Main')}>
        <ul className="cabecera__enlaces">
          {enlaces.map((enlace) => (
            <li key={enlace.href}>
              <a href={enlace.href} onClick={(e) => navegar(e, enlace.href)}>
                {tx(enlace.texto)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="cabecera__derecha">
      <button
        type="button"
        className="cabecera__comandos"
        onClick={() => window.dispatchEvent(new Event('abrir-paleta'))}
        aria-label={t('Abrir paleta de comandos', 'Open command palette')}
      >
        <kbd className="solo-teclado">Ctrl K</kbd>
        <kbd className="solo-tactil">{t('Comandos', 'Commands')}</kbd>
      </button>
      <a className="cabecera__estado" href="#contacto" onClick={(e) => navegar(e, '#contacto')}>
        <span className="cabecera__punto" aria-hidden="true" />
        {t('Disponible', 'Available')}
      </a>
      <button
        type="button"
        className="cabecera__idioma"
        onClick={() => cambiar(idioma === 'es' ? 'en' : 'es')}
        aria-label={t('Switch to English', 'Cambiar a español')}
      >
        <span aria-current={idioma === 'es'}>ES</span>
        <span aria-hidden="true">/</span>
        <span aria-current={idioma === 'en'}>EN</span>
      </button>
      </div>
    </header>
  )
}
