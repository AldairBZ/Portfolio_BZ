import { useState } from 'react'
import './Contacto.css'

const EMAIL = 'aldairbz1719@gmail.com'
const ANIO = new Date().getFullYear()

const redes = [
  { texto: 'LinkedIn', href: 'https://www.linkedin.com/in/scheneiderbz19/' },
  { texto: 'GitHub', href: 'https://github.com/AldairBZ' },
]

export default function Contacto() {
  const [copiado, setCopiado] = useState(false)

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
    <footer id="contacto" className="contacto" aria-labelledby="contacto-titulo">
      <div className="contacto__contenido">
        <p className="etiqueta">Contacto</p>
        <h2 id="contacto-titulo" className="contacto__titulo">
          ¿Construimos
          <br />
          <em>algo juntos?</em>
        </h2>
        <p className="contacto__texto">
          Estoy buscando mi primer puesto como desarrollador. Remoto o híbrido desde Tarragona, con incorporación
          inmediata.
        </p>
        <div className="contacto__acciones">
          <a className="boton boton--lleno contacto__correo" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <button type="button" className="boton" onClick={copiar} aria-live="polite">
            {copiado ? 'Copiado ✓' : 'Copiar email'}
          </button>
          {redes.map((red) => (
            <a key={red.texto} className="boton" href={red.href} target="_blank" rel="noreferrer">
              {red.texto} ↗
            </a>
          ))}
        </div>
      </div>

      <div className="contacto__pie">
        <p>© {ANIO} Scheneider Baltazar · Diseñado y programado por mí.</p>
        <p>
          React · TypeScript · GSAP · Java en el navegador con CheerpJ · Python con Pyodide · Cloudflare
        </p>
      </div>
    </footer>
  )
}
