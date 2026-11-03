import { useEffect, useMemo, useRef, useState } from 'react'
import { bloquearScroll, irA } from '../lib/scroll'
import { proyectos, type Proyecto } from '../data/proyectos'
import { IDIOMAS, useIdioma } from '../lib/idioma'
import { rutaCv } from '../lib/cv'
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

  const { idioma, cambiar, t, tx } = useIdioma()

  const comandos = useMemo<Comando[]>(() => {
    const ir = (destino: string) => () => irA(destino)
    return [
      ...proyectos.map((p) => ({
        id: `ejecutar-${p.id}`,
        grupo: t('Ejecutar', 'Run'),
        texto: tx(p.nombre),
        pista: p.stack.slice(0, 2).join(' · '),
        accion: () => onEjecutar(p),
      })),
      { id: 'ir-inicio', grupo: t('Ir a', 'Go to'), texto: t('Inicio', 'Home'), accion: ir('#inicio') },
      { id: 'ir-proyectos', grupo: t('Ir a', 'Go to'), texto: t('Proyectos', 'Projects'), accion: ir('#proyectos') },
      { id: 'ir-trayectoria', grupo: t('Ir a', 'Go to'), texto: t('Trayectoria', 'Experience'), accion: ir('#trayectoria') },
      { id: 'ir-contacto', grupo: t('Ir a', 'Go to'), texto: t('Contacto', 'Contact'), accion: ir('#contacto') },
      {
        id: 'copiar-email',
        grupo: t('Contacto', 'Contact'),
        texto: t('Copiar mi email', 'Copy my email'),
        pista: 'aldairbz1719@gmail.com',
        accion: () => {
          navigator.clipboard?.writeText('aldairbz1719@gmail.com')
        },
      },
      {
        id: 'cv',
        grupo: t('Contacto', 'Contact'),
        texto: t('Descargar mi CV', 'Download my CV'),
        pista: 'PDF',
        accion: () => {
          const enlace = document.createElement('a')
          enlace.href = rutaCv(idioma)
          enlace.download = ''
          enlace.click()
        },
      },
      {
        id: 'linkedin',
        grupo: t('Contacto', 'Contact'),
        texto: t('Abrir LinkedIn', 'Open LinkedIn'),
        accion: () => {
          window.open('https://www.linkedin.com/in/scheneiderbz19/', '_blank', 'noopener')
        },
      },
      {
        id: 'github',
        grupo: t('Contacto', 'Contact'),
        texto: t('Abrir GitHub', 'Open GitHub'),
        accion: () => {
          window.open('https://github.com/AldairBZ', '_blank', 'noopener')
        },
      },
      ...IDIOMAS.filter((i) => i.codigo !== idioma).map((i) => ({
        id: `idioma-${i.codigo}`,
        grupo: t('Idioma', 'Language'),
        texto: i.nombre,
        pista: i.codigo.toUpperCase(),
        accion: () => cambiar(i.codigo),
      })),
    ]
  }, [onEjecutar, idioma, cambiar, t, tx])

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
        aria-label={t('Paleta de comandos', 'Command palette')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={alTecladoLista}
      >
        <div className="paleta__busqueda">
          <span aria-hidden="true">›</span>
          <input
            ref={campo}
            // Enfocado desde el primer momento: lo que se escriba al abrir no se pierde
            autoFocus
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setActivo(0)
            }}
            placeholder={t('Escribe un comando o un proyecto…', 'Type a command or a project…')}
            aria-label={t('Buscar comando', 'Search command')}
            aria-controls="paleta-lista"
            aria-activedescendant={filtrados[activo] ? `cmd-${filtrados[activo].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <ul id="paleta-lista" className="paleta__lista" role="listbox">
          {filtrados.length === 0 && <li className="paleta__vacio">{t('Sin resultados', 'No results')}</li>}
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
          <kbd>↑</kbd> <kbd>↓</kbd> {t('para moverte', 'to move')} · <kbd>Enter</kbd> {t('para elegir', 'to select')}
        </p>
      </div>
    </div>
  )
}
