import type { Proyecto } from '../data/proyectos'

/**
 * Al acercar el cursor (o el dedo) al botón de un proyecto se descarga por
 * adelantado lo que necesita para ejecutarse: así arranca antes al pulsar.
 */
const hechas = new Set<string>()

export function precargar(tipo: Proyecto['ejecucion']['tipo']) {
  if (hechas.has(tipo)) return
  hechas.add(tipo)
  import('../components/ejecutor/Ejecutor').catch(() => hechas.delete(tipo))
  if (tipo === 'java') import('../components/ejecutor/EjecutorJava').then((m) => m.precalentar())
  if (tipo === 'python') import('../components/ejecutor/EjecutorPython').then((m) => m.precalentar())
  if (tipo === 'cobol') import('../components/ejecutor/EjecutorCobol')
}
