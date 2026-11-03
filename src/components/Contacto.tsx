import { useEffect, useRef, useState } from 'react'
import { DragonAscii } from '../lib/dragonAscii'
import { useIdioma } from '../lib/idioma'
import './Contacto.css'

const EMAIL = 'aldairbz1719@gmail.com'
const ANIO = new Date().getFullYear()

const redes = [
  { texto: 'LinkedIn', href: 'https://www.linkedin.com/in/scheneiderbz19/' },
  { texto: 'GitHub', href: 'https://github.com/AldairBZ' },
]

export default function Contacto() {
  const [copiado, setCopiado] = useState(false)
  const { t } = useIdioma()
  const seccion = useRef<HTMLElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const dragon = new DragonAscii(lienzo.current!, seccion.current!)
    return () => dragon.destruir()
  }, [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <footer id="contacto" className="contacto" aria-labelledby="contacto-titulo" ref={seccion}>
      {/* Detrás del texto: un dragón de caracteres que sigue al cursor */}
      <canvas ref={lienzo} className="contacto__dragon" aria-hidden="true" />
      <div className="contacto__contenido">
        <p className="etiqueta">{t('Contacto', 'Contact')}</p>
        <h2 id="contacto-titulo" className="contacto__titulo">
          {t('¿Construimos', 'Shall we build')}
          <br />
          <em>{t('algo juntos?', 'something together?')}</em>
        </h2>
        <p className="contacto__texto">
          {t(
            'Estoy buscando mi primer puesto como desarrollador. Remoto o híbrido desde Tarragona, con incorporación inmediata.',
            'I am looking for my first developer role. Remote or hybrid from Tarragona, available to start right away.',
          )}
        </p>
        <div className="contacto__acciones">
          <a className="boton boton--lleno contacto__correo" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <button type="button" className="boton" onClick={copiar} aria-live="polite">
            {copiado ? t('Copiado ✓', 'Copied ✓') : t('Copiar email', 'Copy email')}
          </button>
          {redes.map((red) => (
            <a key={red.texto} className="boton" href={red.href} target="_blank" rel="noreferrer">
              {red.texto} ↗
            </a>
          ))}
        </div>
      </div>

      <div className="contacto__pie">
        <p>
          © {ANIO} Scheneider Baltazar · {t('Diseñado y programado por mí.', 'Designed and built by me.')}
        </p>
        <p>
          {t(
            'React · TypeScript · GSAP · Java en el navegador con CheerpJ · Python con Pyodide · COBOL con un intérprete propio · Cloudflare',
            'React · TypeScript · GSAP · Java in the browser with CheerpJ · Python with Pyodide · COBOL on my own interpreter · Cloudflare',
          )}
        </p>
        <p>{t('Visitas contadas de forma anónima, sin cookies.', 'Visits counted anonymously, without cookies.')}</p>
      </div>
    </footer>
  )
}
