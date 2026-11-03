import { useEffect, useMemo, useRef, useState } from 'react'
import { bloquearScroll, irA } from '../lib/scroll'
import { proyectos, type Proyecto } from '../data/proyectos'
import './Paleta.css'

interface Comando {
  id: string
  grupo: string
  texto: string
  pista?: string
  accion: () => void
}

interface Props {
  onEjecutar: (proyecto: Proyecto) => void
}

/** Paleta de comandos que se abre con Ctrl + K (o Cmd + K) */
export default function Paleta({ onEjecutar }: Props) {
  const [abierta, setAbierta] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState(0)
  const campo = useRef<HTMLInputElement>(null)

  const comandos = useMemo<Comando[]>(() => {
    const ir = (destino: string) => () => irA(destino)
    return [
      ...proyectos.map((p) => ({
        id: `ejecutar-${p.id}`,
        grupo: 'Ejecutar',
        texto: p.nombre,
        pista: p.stack.slice(0, 2).join(' · '),
        accion: () => onEjecutar(p),
      })),
      { id: 'ir-inicio', grupo: 'Ir a', texto: 'Inicio', accion: ir('#inicio') },
      { id: 'ir-proyectos', grupo: 'Ir a', texto: 'Proyectos', accion: ir('#proyectos') },
      { id: 'ir-trayectoria', grupo: 'Ir a', texto: 'Trayectoria', accion: ir('#trayectoria') },
      { id: 'ir-contacto', grupo: 'Ir a', texto: 'Contacto', accion: ir('#contacto') },
      {
        id: 'copiar-email',
        grupo: 'Contacto',
        texto: 'Copiar mi email',
        pista: 'aldairbz1719@gmail.com',
        accion: () => navigator.clipboard?.writeText('aldairbz1719@gmail.com'),
      },
      {
        id: 'linkedin',
        grupo: 'Contacto',
        texto: 'Abrir LinkedIn',
        accion: () => window.open('https://www.linkedin.com/in/scheneiderbz19/', '_blank', 'noopener'),
      },
      {
        id: 'github',
        grupo: 'Contacto',
        texto: 'Abrir GitHub',
        accion: () => window.open('https://github.com/AldairBZ', '_blank', 'noopener'),
      },
    ]
  }, [onEjecutar])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return comandos
    return comandos.filter((c) => `${c.grupo} ${c.texto} ${c.pista ?? ''}`.toLowerCase().includes(q))
  }, [busqueda, comandos])

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBusqueda('')
        setActivo(0)
        setAbierta((a) => !a)
      }
    }
    const abrir = () => {
      setBusqueda('')
      setActivo(0)
      setAbierta(true)
    }
    window.addEventListener('keydown', alTeclado)
    window.addEventListener('abrir-paleta', abrir)
    return () => {
      window.removeEventListener('keydown', alTeclado)
      window.removeEventListener('abrir-paleta', abrir)
    }
  }, [])

  useEffect(() => {
    if (!abierta) return
    bloquearScroll(true)
    requestAnimationFrame(() => campo.current?.focus())
    return () => bloquearScroll(false)
  }, [abierta])

  if (!abierta) return null

  const ejecutar = (c: Comando) => {
    setAbierta(false)
    // Espera a que se cierre la paleta para no pelear con el bloqueo del scroll
    setTimeout(c.accion, 30)
  }

  const alTecladoLista = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((i) => Math.min(filtrados.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && filtrados[activo]) {
      e.preventDefault()
      ejecutar(filtrados[activo])
    } else if (e.key === 'Escape') {
      setAbierta(false)
    }
  }

  let grupoAnterior = ''

  return (
    <div className="paleta" role="presentation" onClick={() => setAbierta(false)}>
      <div
        className="paleta__caja"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={alTecladoLista}
      >
        <div className="paleta__busqueda">
          <span aria-hidden="true">›</span>
          <input
            ref={campo}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setActivo(0)
            }}
            placeholder="Escribe un comando o un proyecto…"
            aria-label="Buscar comando"
            aria-controls="paleta-lista"
            aria-activedescendant={filtrados[activo] ? `cmd-${filtrados[activo].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="paleta-lista" className="paleta__lista" role="listbox">
          {filtrados.length === 0 && <li className="paleta__vacio">Sin resultados</li>}
          {filtrados.map((c, i) => {
            const cabecera = c.grupo !== grupoAnterior ? c.grupo : null
            grupoAnterior = c.grupo
            return (
              <li key={c.id} role="none">
                {cabecera && <p className="paleta__grupo">{cabecera}</p>}
                <button
                  id={`cmd-${c.id}`}
                  type="button"
                  role="option"
                  aria-selected={i === activo}
                  className="paleta__opcion"
                  onMouseMove={() => setActivo(i)}
                  onClick={() => ejecutar(c)}
                >
                  <span>{c.texto}</span>
                  {c.pista && <small>{c.pista}</small>}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="paleta__pie">
          <kbd>↑</kbd> <kbd>↓</kbd> para moverte · <kbd>Enter</kbd> para elegir
        </p>
      </div>
    </div>
  )
}
