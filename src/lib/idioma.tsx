import { registrar } from './analitica'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Idioma = 'es' | 'en'
export type Texto = { es: string; en: string }

interface ValorIdioma {
  idioma: Idioma
  cambiar: (idioma: Idioma) => void
  /** Devuelve el texto en el idioma activo: t('Hola', 'Hello') */
  t: (es: string, en: string) => string
  /** Lo mismo para textos guardados como { es, en } */
  tx: (texto: Texto) => string
}

const CLAVE = 'idioma'
const Contexto = createContext<ValorIdioma | null>(null)

function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'es' || guardado === 'en') return guardado
  } catch {
    // Sin acceso a localStorage: se decide por el navegador
  }
  // Español y catalán ven la versión en español; el resto, la inglesa
  return /^(es|ca|gl|eu)\b/i.test(navigator.language) ? 'es' : 'en'
}

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial)

  useEffect(() => {
    document.documentElement.lang = idioma
    document.title =
      idioma === 'es' ? 'Scheneider Baltazar · Desarrollador Full Stack' : 'Scheneider Baltazar · Full Stack Developer'
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
      t: (es, en) => (idioma === 'es' ? es : en),
      tx: (texto) => texto[idioma],
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
