import { useCallback, useEffect, useRef, useState } from 'react'
import { ProgramaCobol, type Traza } from '../../lib/cobol/interprete'
import { Cargando } from './Ejecutor'
import EjecutorCodigo from './EjecutorCodigo'
import './EjecutorCobol.css'

const PUENTE = 'DATA/BRIDGE.DAT'
const FICHAS = [1, 5, 25, 100, 500, 1000]

// Mismo diseño de registro que WS-STATE en el programa COBOL (220 caracteres)
const CAMPOS = [
  { nombre: 'WS-COMMAND', largo: 10 },
  { nombre: 'WS-PLAYER', largo: 20 },
  { nombre: 'WS-STATUS', largo: 12 },
  { nombre: 'WS-P-CARDS', largo: 50 },
  { nombre: 'WS-P-SCORE', largo: 2 },
  { nombre: 'WS-D-CARDS', largo: 50 },
  { nombre: 'WS-D-SCORE', largo: 2 },
  { nombre: 'WS-CHIPS', largo: 6 },
  { nombre: 'WS-BET', largo: 6 },
  { nombre: 'WS-WINS', largo: 4 },
  { nombre: 'WS-GAMES', largo: 4 },
  { nombre: 'WS-MESSAGE', largo: 24 },
  { nombre: 'WS-SHOE-REMAIN', largo: 3 },
  { nombre: 'WS-SHOE-TOTAL', largo: 3 },
]

function trocear(registro: string) {
  const valores: Record<string, string> = {}
  let pos = 0
  for (const c of CAMPOS) {
    valores[c.nombre] = registro.slice(pos, pos + c.largo)
    pos += c.largo
  }
  return valores
}

const cartas = (texto: string) => texto.split(',').map((c) => c.trim()).filter(Boolean)

const FINALES = ['PLAYER_WIN', 'DEALER_WIN', 'PUSH']

interface Ejecucion {
  comando: string
  traza: Traza
  ms: number
}

export default function EjecutorCobol() {
  const programa = useRef<ProgramaCobol | null>(null)
  const [registro, setRegistro] = useState('')
  const [anterior, setAnterior] = useState('')
  const [ultima, setUltima] = useState<Ejecucion | null>(null)
  const [analisis, setAnalisis] = useState<{ ms: number; parrafos: number } | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<'mesa' | 'codigo'>('mesa')
  const ultimaApuesta = useRef(0)

  const leer = () => (programa.current?.disco.get(PUENTE) ?? '').replace(/\n$/, '').padEnd(220, ' ')

  // Igual que la interfaz en Python: escribe el comando en BRIDGE.DAT y lanza el programa
  const ejecutar = useCallback((comando: string) => {
    const prog = programa.current
    if (!prog) return
    const actual = leer()
    prog.disco.set(PUENTE, `${comando.padEnd(10)}${'VISITANTE'.padEnd(20)}${actual.slice(30, 220)}\n`)
    const inicio = performance.now()
    try {
      const traza = prog.ejecutarPrograma()
      setUltima({ comando, traza, ms: performance.now() - inicio })
      setAnterior(actual)
      setRegistro(leer())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    let activo = true
    fetch('/apps/blackjack/blackjack.cob.cbl')
      .then((r) => r.text())
      .then((fuente) => {
        if (!activo) return
        const inicio = performance.now()
        programa.current = new ProgramaCobol(fuente)
        setAnalisis({ ms: performance.now() - inicio, parrafos: programa.current.estadisticas.parrafos })
        ejecutar('RESETALL')
      })
      .catch((e) => activo && setError(String(e)))
    return () => {
      activo = false
    }
  }, [ejecutar])

  const v = trocear(registro)
  const estado = v['WS-STATUS']?.trim() ?? ''
  const jugando = estado === 'PLAYING'
  const terminada = FINALES.includes(estado)
  const fichas = Number(v['WS-CHIPS'] || 0)
  const apuesta = Number(v['WS-BET'] || 0)
  if (apuesta > 0) ultimaApuesta.current = apuesta

  const apostar = (cantidad: number) => {
    if (terminada) ejecutar('RESET')
    ejecutar(`BET${String(cantidad).padStart(7, '0')}`)
  }

  const repartir = () => {
    if (terminada) ejecutar('RESET')
    ejecutar('START')
  }

  // Atajos de teclado: P pedir, S plantarse, Espacio repartir
  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (vista !== 'mesa' || e.target instanceof HTMLInputElement) return
      const tecla = e.key.toLowerCase()
      if (tecla === 'p' && jugando) ejecutar('HIT')
      else if (tecla === 's' && jugando) ejecutar('STAND')
      else if (tecla === ' ' && !jugando && apuesta > 0) {
        e.preventDefault()
        ejecutar('START')
      }
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [vista, jugando, apuesta, ejecutar])

  if (error) return <Cargando texto={`Error en el intérprete: ${error}`} />
  if (!registro) return <Cargando texto="Analizando el programa COBOL…" />

  const mensaje = (() => {
    if (estado === 'PLAYER_WIN') return { texto: `GANASTE +$${ultimaApuesta.current}`, tono: 'gana' }
    if (estado === 'DEALER_WIN') return { texto: `PERDISTE -$${ultimaApuesta.current}`, tono: 'pierde' }
    if (estado === 'PUSH') return { texto: 'EMPATE', tono: 'empate' }
    return { texto: v['WS-MESSAGE'].trim(), tono: '' }
  })()

  const restantes = Math.min(Number(v['WS-SHOE-REMAIN'] || 0), Number(v['WS-SHOE-TOTAL'] || 312))
  const cartasJugador = cartas(v['WS-P-CARDS'])
  const cartasCrupier = cartas(v['WS-D-CARDS'])
  const antes = trocear(anterior)

  return (
    <div className="cobol">
      <div className="cobol__pestanas" role="tablist">
        <button type="button" role="tab" aria-selected={vista === 'mesa'} onClick={() => setVista('mesa')}>
          Mesa
        </button>
        <button type="button" role="tab" aria-selected={vista === 'codigo'} onClick={() => setVista('codigo')}>
          blackjack.cob.cbl
        </button>
        {analisis && (
          <span className="cobol__dato">
            {analisis.parrafos} párrafos analizados en {analisis.ms.toFixed(1)} ms
          </span>
        )}
      </div>

      {vista === 'codigo' ? (
        <div className="cobol__codigo">
          <EjecutorCodigo />
        </div>
      ) : (
        <div className="cobol__juego">
          <div className="cobol__mesa">
            <Mano titulo="Crupier" codigos={cartasCrupier} ocultar={jugando} puntos={jugando ? '?' : Number(v['WS-D-SCORE'])} />
            <p className={`cobol__mensaje cobol__mensaje--${mensaje.tono}`} aria-live="polite">
              {mensaje.texto}
            </p>
            <Mano titulo="Tú" codigos={cartasJugador} puntos={Number(v['WS-P-SCORE'])} />
          </div>

          <div className="cobol__panel">
            <dl className="cobol__saldo">
              <div>
                <dt>Saldo</dt>
                <dd>${fichas}</dd>
              </div>
              <div>
                <dt>Apuesta</dt>
                <dd>${apuesta}</dd>
              </div>
              <div>
                <dt>Mazo</dt>
                <dd>{restantes}/312</dd>
              </div>
            </dl>
            <div className="cobol__fichas" aria-label="Apostar">
              {FICHAS.map((f) => (
                <button key={f} type="button" disabled={jugando || f > fichas} onClick={() => apostar(f)} aria-label={`Apostar ${f}`}>
                  <img src={`/apps/blackjack/fichas/${f}.webp`} alt="" width="52" height="52" />
                  <span>${f}</span>
                </button>
              ))}
            </div>
            <div className="cobol__acciones">
              <button type="button" className="boton boton--lleno" disabled={jugando || (apuesta === 0 && !terminada)} onClick={repartir}>
                Repartir
              </button>
              <button type="button" className="boton" disabled={!jugando} onClick={() => ejecutar('HIT')}>
                Pedir <kbd className="solo-teclado">P</kbd>
              </button>
              <button type="button" className="boton" disabled={!jugando} onClick={() => ejecutar('STAND')}>
                Plantarse <kbd className="solo-teclado">S</kbd>
              </button>
              <button type="button" className="cobol__reinicio" onClick={() => ejecutar('RESETALL')}>
                Reiniciar saldo
              </button>
            </div>
          </div>

          <div className="cobol__puente">
            <p className="etiqueta">
              DATA/BRIDGE.DAT · {ultima?.comando.trim()} → {ultima?.traza.sentencias.toLocaleString('es')} instrucciones COBOL en{' '}
              {ultima?.ms.toFixed(1)} ms
            </p>
            <div className="cobol__registro">
              {CAMPOS.map((c) => (
                <span
                  key={c.nombre}
                  className={`cobol__campo${antes[c.nombre] !== v[c.nombre] ? ' cobol__campo--cambio' : ''}`}
                  title={`${c.nombre} PIC ${/SCORE|CHIPS|BET|WINS|GAMES|SHOE/.test(c.nombre) ? '9' : 'X'}(${c.largo})`}
                >
                  <small>{c.nombre}</small>
                  <code>{v[c.nombre].replace(/ /g, '·')}</code>
                </span>
              ))}
            </div>
            <p className="cobol__traza">
              {[...new Set(ultima?.traza.parrafos ?? [])].join(' → ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Mano({ titulo, codigos, puntos, ocultar }: { titulo: string; codigos: string[]; puntos: number | string; ocultar?: boolean }) {
  return (
    <div className="mano">
      <p className="mano__titulo">
        {titulo} <span>{codigos.length ? puntos : ''}</span>
      </p>
      <div className="mano__cartas">
        {codigos.length === 0 && <span className="mano__hueco" aria-hidden="true" />}
        {codigos.map((codigo, i) => {
          const oculta = ocultar && i === 1
          return (
            <img
              key={`${i}-${oculta ? 'x' : codigo}`}
              src={`/apps/blackjack/cartas/${oculta ? 'HIDDEN' : codigo}.webp`}
              alt={oculta ? 'Carta boca abajo' : codigo}
              width="113"
              height="157"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          )
        })}
      </div>
    </div>
  )
}
