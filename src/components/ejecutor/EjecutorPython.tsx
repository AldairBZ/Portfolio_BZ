import { useCallback, useEffect, useRef, useState } from 'react'
import { Cargando } from './Ejecutor'
import { cargarScript } from '../../lib/cargarScript'

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/'

interface Pyodide {
  runPythonAsync: (codigo: string, opciones?: { globals?: unknown }) => Promise<unknown>
  loadPackage: (paquetes: string | string[]) => Promise<void>
  setStdout: (opciones: { write: (buffer: Uint8Array) => number }) => void
  setStderr: (opciones: { write: (buffer: Uint8Array) => number }) => void
  FS: { writeFile: (ruta: string, datos: string) => void; unlink: (ruta: string) => void }
  globals: { set: (nombre: string, valor: unknown) => void }
}

declare global {
  interface Window {
    loadPyodide?: (opciones: { indexURL: string }) => Promise<Pyodide>
  }
}

let pyodide: Promise<Pyodide> | null = null

function cargarPyodide() {
  if (!pyodide) {
    pyodide = (async () => {
      await cargarScript(`${PYODIDE}pyodide.js`)
      const py = await window.loadPyodide!({ indexURL: PYODIDE })
      await py.loadPackage('sqlite3')
      return py
    })()
  }
  return pyodide
}

/*
 * El programa original usa input(), que en el navegador no puede bloquear.
 * Este código convierte sus funciones en asíncronas para que cada input()
 * espere a que escribas en la terminal, sin tocar una línea del archivo original.
 */
const LANZADOR = `
import ast, sys, os

class _Asincrono(ast.NodeTransformer):
    def __init__(self, nombres):
        self.nombres = nombres
    def visit_FunctionDef(self, nodo):
        self.generic_visit(nodo)
        nuevo = ast.AsyncFunctionDef(**{c: getattr(nodo, c, None) for c in ast.AsyncFunctionDef._fields})
        return ast.copy_location(nuevo, nodo)
    def visit_Call(self, nodo):
        self.generic_visit(nodo)
        if isinstance(nodo.func, ast.Name) and (nodo.func.id == 'input' or nodo.func.id in self.nombres):
            if nodo.func.id == 'input':
                nodo.func.id = '__entrada'
            return ast.copy_location(ast.Await(value=nodo), nodo)
        return nodo

async def __entrada(texto=''):
    print(texto, end='')
    sys.stdout.flush()
    respuesta = await pedir_linea()
    print(respuesta)
    return respuesta

async def __lanzar(nombre_archivo):
    os.chdir('/home/pyodide/app')
    if '/home/pyodide/app' not in sys.path:
        sys.path.insert(0, '/home/pyodide/app')
    for modulo in ('database', 'models'):
        sys.modules.pop(modulo, None)
    fuente = open(nombre_archivo, encoding='utf-8').read()
    arbol = ast.parse(fuente, nombre_archivo)
    nombres = {n.name for n in arbol.body if isinstance(n, ast.FunctionDef)}
    arbol = ast.fix_missing_locations(_Asincrono(nombres).visit(arbol))
    codigo = compile(arbol, nombre_archivo, 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    espacio = {'__name__': '__main__', '__entrada': __entrada}
    resultado = eval(codigo, espacio)
    if resultado is not None:
        await resultado
`

type Linea = { texto: string; tipo: 'salida' | 'error' | 'entrada' }

export default function EjecutorPython({ archivos, principal }: { archivos: string[]; principal: string }) {
  const [estado, setEstado] = useState<'cargando' | 'ejecutando' | 'terminado' | 'error'>('cargando')
  const [salida, setSalida] = useState<Linea[]>([])
  const [esperando, setEsperando] = useState(false)
  const [valor, setValor] = useState('')
  const resolverLinea = useRef<((linea: string) => void) | null>(null)
  const pantalla = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  const activo = useRef(true)
  // Cada ejecución tiene un número; una ejecución antigua no escribe ni continúa
  const ejecucion = useRef(0)

  const escribir = useCallback((texto: string, tipo: Linea['tipo'] = 'salida') => {
    if (!activo.current) return
    setSalida((prev) => {
      const ultima = prev[prev.length - 1]
      // Junta el texto con la última línea si no terminó en salto
      if (ultima && ultima.tipo === tipo && !ultima.texto.endsWith('\n')) {
        return [...prev.slice(0, -1), { tipo, texto: ultima.texto + texto }]
      }
      return [...prev, { tipo, texto }]
    })
  }, [])

  const ejecutar = useCallback(async () => {
    const id = ++ejecucion.current
    const vigente = () => activo.current && id === ejecucion.current
    setSalida([])
    setEstado('cargando')
    try {
      const py = await cargarPyodide()
      if (!vigente()) return
      const decodificador = new TextDecoder()
      py.setStdout({ write: (b) => (escribir(decodificador.decode(b, { stream: true })), b.length) })
      py.setStderr({ write: (b) => (escribir(decodificador.decode(b, { stream: true }), 'error'), b.length) })
      py.globals.set(
        'pedir_linea',
        () =>
          new Promise<string>((resolver) => {
            setEsperando(true)
            resolverLinea.current = resolver
          }),
      )
      try {
        py.FS.unlink('/home/pyodide/app/forn.db')
      } catch {
        // No existía una base de datos previa
      }
      await py.runPythonAsync("import os; os.makedirs('/home/pyodide/app', exist_ok=True)")
      const textos = await Promise.all(archivos.map((a) => fetch(`/apps/bongust/${a}`).then((r) => r.text())))
      if (!vigente()) return
      archivos.forEach((archivo, i) => py.FS.writeFile(`/home/pyodide/app/${archivo}`, textos[i]))
      await py.runPythonAsync(LANZADOR)
      setEstado('ejecutando')
      await py.runPythonAsync(`await __lanzar('${principal}')`)
      if (vigente()) setEstado('terminado')
    } catch (error) {
      if (!vigente()) return
      const mensaje = error instanceof Error ? error.message : String(error)
      // Los errores de Python (por ejemplo, escribir letras donde se espera un número) se muestran como en una terminal real
      escribir(`\n${mensaje.split('\n').slice(-3).join('\n')}\n`, 'error')
      setEstado(mensaje.includes('Traceback') || mensaje.includes('Error') ? 'terminado' : 'error')
    } finally {
      if (vigente()) setEsperando(false)
    }
  }, [archivos, principal, escribir])

  useEffect(() => {
    activo.current = true
    ejecutar()
    return () => {
      activo.current = false
      resolverLinea.current = null
    }
  }, [ejecutar])

  useEffect(() => {
    pantalla.current?.scrollTo({ top: pantalla.current.scrollHeight })
    if (esperando) campo.current?.focus({ preventScroll: true })
  }, [salida, esperando])

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const resolver = resolverLinea.current
    if (!resolver) return
    resolverLinea.current = null
    setEsperando(false)
    setValor('')
    resolver(valor)
  }

  return (
    <div className="terminal" onClick={() => campo.current?.focus({ preventScroll: true })}>
      <div className="terminal__barra">
        <span className="etiqueta">python3 {principal}</span>
        {estado === 'terminado' && (
          <button type="button" className="terminal__reiniciar" onClick={ejecutar}>
            Volver a ejecutar
          </button>
        )}
      </div>
      {estado === 'cargando' && <Cargando texto="Cargando Python 3 y SQLite en tu navegador…" />}
      {estado === 'error' && <Cargando texto="No se pudo cargar Python. Revisa tu conexión y vuelve a intentarlo." />}
      <div className="terminal__pantalla" ref={pantalla} aria-live="polite">
        {salida.map((linea, i) => (
          <span key={i} className={`terminal__${linea.tipo}`}>
            {linea.texto}
          </span>
        ))}
        {esperando && (
          <form className="terminal__entrada" onSubmit={enviar}>
            <label className="sr-only" htmlFor="terminal-campo">
              Respuesta para el programa
            </label>
            <input
              id="terminal-campo"
              ref={campo}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </form>
        )}
        {estado === 'terminado' && <span className="terminal__fin">{'\n'}— Programa terminado —</span>}
      </div>
    </div>
  )
}
