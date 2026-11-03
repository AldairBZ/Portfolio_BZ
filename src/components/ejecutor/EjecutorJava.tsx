import { useEffect, useRef, useState } from 'react'
import { Cargando } from './Ejecutor'
import { useIdioma } from '../../lib/idioma'
import { cargarScript } from '../../lib/cargarScript'

declare global {
  interface Window {
    cheerpjInit?: (opciones?: Record<string, unknown>) => Promise<void>
    cheerpjCreateDisplay?: (ancho: number, alto: number, padre?: HTMLElement) => HTMLElement
    cheerpjRunJar?: (ruta: string, ...args: string[]) => Promise<number>
  }
}

const CHEERPJ = 'https://cjrtnc.leaningtech.com/5.0/loader.js'

// CheerpJ solo puede iniciarse una vez por página: la pantalla se reutiliza entre aperturas
let pantalla: HTMLElement | null = null
let arranque: Promise<void> | null = null

function arrancar(jar: string) {
  if (!arranque) {
    arranque = (async () => {
      await cargarScript(CHEERPJ)
      await window.cheerpjInit!({ version: 21, status: 'none' })
      pantalla = document.createElement('div')
      pantalla.className = 'java__pantalla'
      document.body.appendChild(pantalla)
      window.cheerpjCreateDisplay!(-1, -1, pantalla)
      // No se espera: la promesa solo termina cuando se cierra el programa
      window.cheerpjRunJar!(`/app${jar}`)
    })()
  }
  return arranque
}

const controles = [
  { tecla: 'ArrowLeft', codigo: 37, texto: '←', nombre: { es: 'Izquierda', en: 'Left' } },
  { tecla: 'ArrowUp', codigo: 38, texto: '↻', nombre: { es: 'Girar', en: 'Rotate' } },
  { tecla: 'ArrowRight', codigo: 39, texto: '→', nombre: { es: 'Derecha', en: 'Right' } },
  { tecla: 'ArrowDown', codigo: 40, texto: '↓', nombre: { es: 'Bajar', en: 'Down' } },
  { tecla: ' ', codigo: 32, texto: '⤓', nombre: { es: 'Caída rápida', en: 'Hard drop' } },
  { tecla: 'c', codigo: 67, texto: 'C', nombre: { es: 'Guardar pieza', en: 'Hold piece' } },
]

function pulsar(tecla: string, codigo: number) {
  const destino = (pantalla?.querySelector('canvas, [tabindex]') as HTMLElement | null) ?? document.body
  destino.focus?.()
  for (const tipo of ['keydown', 'keyup'] as const) {
    const evento = new KeyboardEvent(tipo, {
      key: tecla,
      code: tecla === ' ' ? 'Space' : tecla.length === 1 ? `Key${tecla.toUpperCase()}` : tecla,
      keyCode: codigo,
      which: codigo,
      bubbles: true,
      cancelable: true,
    })
    destino.dispatchEvent(evento)
  }
}

export default function EjecutorJava({ jar }: { jar: string }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>(pantalla ? 'listo' : 'cargando')
  const { t, tx } = useIdioma()

  useEffect(() => {
    let activo = true
    arrancar(jar)
      .then(() => {
        if (!activo || !pantalla || !contenedor.current) return
        contenedor.current.appendChild(pantalla)
        setEstado('listo')
      })
      .catch(() => activo && setEstado('error'))
    return () => {
      activo = false
      // La pantalla vuelve a su escondite para conservar la partida
      if (pantalla) document.body.appendChild(pantalla)
    }
  }, [jar])

  return (
    <div className="java">
      {estado === 'cargando' && <Cargando texto={t('Arrancando una máquina virtual de Java en tu navegador…', 'Starting a Java virtual machine in your browser…')} />}
      {estado === 'error' && <Cargando texto={t('No se pudo iniciar Java en este navegador. Prueba con Chrome, Edge o Firefox actualizados.', 'Java could not start in this browser. Try an up-to-date Chrome, Edge or Firefox.')} />}
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
      <p className="java__ayuda">{t('Teclado: flechas para mover y girar, espacio para soltar, C para guardar pieza.', 'Keyboard: arrows to move and rotate, space to drop, C to hold a piece.')}</p>
    </div>
  )
}
