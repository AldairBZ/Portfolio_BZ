import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CATALAN } from './catalan'
import { registrar } from './analitica'

export type Idioma = 'es' | 'ca' | 'en'
/** El catalán es opcional: si falta, se busca la traducción del texto en español en catalan.ts */
export type Texto = { es: string; en: string; ca?: string }

// eslint-disable-next-line react-refresh/only-export-components
export const IDIOMAS: { codigo: Idioma; nombre: string }[] = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'ca', nombre: 'Català' },
  { codigo: 'en', nombre: 'English' },
]

const TITULOS: Record<Idioma, string> = {
  es: 'Scheneider Baltazar · Desarrollador Full Stack',
  ca: 'Scheneider Baltazar · Desenvolupador Full Stack',
  en: 'Scheneider Baltazar · Full Stack Developer',
}

function enCatalan(es: string) {
  const traducido = CATALAN[es]
  if (traducido === undefined && import.meta.env.DEV) console.warn('Falta traducir al catalán:', es)
  return traducido ?? es
}

interface ValorIdioma {
  idioma: Idioma
  cambiar: (idioma: Idioma) => void
  /** Devuelve el texto en el idioma activo: t('Hola', 'Hello'); el catalán sale de catalan.ts o del tercer argumento */
  t: (es: string, en: string, ca?: string) => string
  /** Lo mismo para textos guardados como { es, en } */
  tx: (texto: Texto) => string
}

const CLAVE = 'idioma'
const Contexto = createContext<ValorIdioma | null>(null)

function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'es' || guardado === 'ca' || guardado === 'en') return guardado
  } catch {
    // Sin acceso a localStorage: se decide por el navegador
  }
  // El primer idioma de las preferencias del navegador que la web conozca
  for (const preferido of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const codigo = preferido.toLowerCase()
    if (/^(ca|oc)\b/.test(codigo) || codigo.endsWith('-valencia')) return 'ca'
    if (/^(es|gl|eu)\b/.test(codigo)) return 'es'
    if (/^en\b/.test(codigo)) return 'en'
  }
  return 'en'
}

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial)

  useEffect(() => {
    document.documentElement.lang = idioma
    document.title = TITULOS[idioma]
  }, [idioma])

  const cambiar = useCallback((nuevo: Idioma) => {
    registrar('idioma', nuevo)
    setIdioma(nuevo)
    try {
      localStorage.setItem(CLAVE, nuevo)
    } catch {
      // No se puede recordar: no pasa nada
    }
  }, [])

  const valor = useMemo<ValorIdioma>(
    () => ({
      idioma,
      cambiar,
      t: (es, en, ca) => (idioma === 'es' ? es : idioma === 'en' ? en : (ca ?? enCatalan(es))),
      tx: (texto) => (idioma === 'ca' ? (texto.ca ?? enCatalan(texto.es)) : texto[idioma]),
    }),
    [idioma, cambiar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIdioma() {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useIdioma necesita ProveedorIdioma')
  return valor
}
