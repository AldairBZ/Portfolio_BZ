import { useEffect, useRef, useState } from 'react'
import { Cargando } from './Ejecutor'
import { useIdioma } from '../../lib/idioma'

const CHEERPJ = 'https://cjrtnc.leaningtech.com/5.0/loader.js'
// La página de Java mide siempre 560 x 720: dentro, la ventana del juego cabe entera
const ANCHO = 560
const ALTO = 720

/** Pide al navegador el cargador de Java antes de que se pulse el botón */
// eslint-disable-next-line react-refresh/only-export-components
export function precalentar() {
  if (document.querySelector(`link[href="${CHEERPJ}"]`)) return
  const enlace = document.createElement('link')
  enlace.rel = 'prefetch'
  enlace.href = CHEERPJ
  document.head.appendChild(enlace)
}

/*
 * Java se ejecuta en un iframe (public/apps/java.html). Un iframe se recarga si se
 * mueve por el DOM, así que se crea una vez, se queda en <body> con posición fija
 * y solo se coloca encima del marco mientras la ventana del proyecto está abierta.
 * Así la partida se conserva al cerrar y volver a abrir.
 */
let marco: HTMLIFrameElement | null = null
let estadoJava: 'cargando' | 'listo' | 'error' = 'cargando'
const oyentes = new Set<(estado: typeof estadoJava) => void>()

function obtenerMarco(jar: string) {
  if (!marco) {
    marco = document.createElement('iframe')
    marco.src = `/apps/java.html?jar=${encodeURIComponent(jar)}`
    marco.title = 'Java'
    marco.className = 'java__iframe'
    marco.width = String(ANCHO)
    marco.height = String(ALTO)
    document.body.appendChild(marco)
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.data?.origen !== 'java') return
      if (e.data.tecla === 'Escape') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        return
      }
      estadoJava = e.data.estado
      oyentes.forEach((avisar) => avisar(estadoJava))
    })
  }
  return marco
}

function ocultarMarco() {
  if (marco) marco.classList.remove('java__iframe--visible')
}

const controles = [
  { tecla: 'ArrowLeft', codigo: 37, texto: '←', nombre: { es: 'Izquierda', en: 'Left' } },
  { tecla: 'ArrowUp', codigo: 38, texto: '↻', nombre: { es: 'Girar', en: 'Rotate' } },
  { tecla: 'ArrowRight', codigo: 39, texto: '→', nombre: { es: 'Derecha', en: 'Right' } },
  { tecla: 'ArrowDown', codigo: 40, texto: '↓', nombre: { es: 'Bajar', en: 'Down' } },
  { tecla: ' ', codigo: 32, texto: '⤓', nombre: { es: 'Caída rápida', en: 'Hard drop' } },
  { tecla: 'c', codigo: 67, texto: 'C', nombre: { es: 'Guardar pieza', en: 'Hold piece' } },
]

export default function EjecutorJava({ jar }: { jar: string }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState(estadoJava)
  const { t, tx } = useIdioma()

  useEffect(() => {
    const iframe = obtenerMarco(jar)
    oyentes.add(setEstado)

    // Coloca y escala el iframe encima del marco, en el móvil y en el ordenador
    const colocar = () => {
      const zona = contenedor.current?.getBoundingClientRect()
      if (!zona) return
      const escala = Math.min(zona.width / ANCHO, zona.height / ALTO, 1.3)
      iframe.style.transform = `translate(${zona.left + (zona.width - ANCHO * escala) / 2}px, ${zona.top + (zona.height - ALTO * escala) / 2}px) scale(${escala})`
      iframe.classList.add('java__iframe--visible')
    }
    colocar()
    const observador = new ResizeObserver(colocar)
    if (contenedor.current) observador.observe(contenedor.current)
    window.addEventListener('resize', colocar)
    // Con el foco dentro, el teclado del ordenador controla el juego directamente
    iframe.focus()

    return () => {
      oyentes.delete(setEstado)
      observador.disconnect()
      window.removeEventListener('resize', colocar)
      ocultarMarco()
    }
  }, [jar])

  const pulsar = (tecla: string, codigo: number) => {
    marco?.contentWindow?.postMessage({ origen: 'portfolio', tecla, codigo }, location.origin)
  }

  return (
    <div className="java">
      {estado === 'cargando' && (
        <Cargando
          texto={t('Arrancando una máquina virtual de Java en tu navegador…', 'Starting a Java virtual machine in your browser…')}
        />
      )}
      {estado === 'error' && (
        <Cargando
          texto={t(
            'No se pudo iniciar Java en este navegador. Prueba con Chrome, Edge o Firefox actualizados.',
            'Java could not start in this browser. Try an up-to-date Chrome, Edge or Firefox.',
          )}
        />
      )}
      <div className="java__marco" ref={contenedor} />
      <div className="java__controles" aria-label={t('Controles del juego', 'Game controls')}>
        {controles.map((c) => (
          <button
            key={c.nombre.es}
            type="button"
            aria-label={tx(c.nombre)}
            onPointerDown={(e) => {
              e.preventDefault()
              pulsar(c.tecla, c.codigo)
            }}
          >
            {c.texto}
          </button>
        ))}
      </div>
      <p className="java__ayuda">
        {t(
          'Teclado: flechas para mover y girar, espacio para soltar, C para guardar pieza.',
          'Keyboard: arrows to move and rotate, space to drop, C to hold a piece.',
        )}
      </p>
    </div>
  )
}
