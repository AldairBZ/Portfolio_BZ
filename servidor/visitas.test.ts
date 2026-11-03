import { describe, expect, it } from 'vitest'
import { iguales, origen, resumir, type Fila } from './resumen'

const hoy = new Date('2026-11-03T12:00:00Z')
const fila = (visitante: string, evento: string, detalle = '', extra: Partial<Fila> = {}): Fila => ({
  fecha: '2026-11-03T10:00:00Z',
  sesion: `${visitante}-1`,
  visitante,
  evento,
  detalle,
  idioma: 'es',
  referencia: '',
  pais: 'ES',
  ciudad: 'Tarragona',
  red: '',
  dispositivo: 'ordenador',
  ...extra,
})

const filas: Fila[] = [
  // Alguien de LinkedIn desde la red de una empresa, que vuelve al día siguiente desde GitHub
  fila('b', 'visita', '', { referencia: 'ref:linkedin', red: 'Indra Sistemas', fecha: '2026-11-02T09:00:00Z' }),
  fila('b', 'ejecutar', 'tetris', { fecha: '2026-11-02T09:01:00Z' }),
  fila('b', 'visita', '', { referencia: 'github.com', sesion: 'b-2', fecha: '2026-11-03T09:00:00Z' }),
  fila('b', 'repo', 'TetrisGame', { sesion: 'b-2', fecha: '2026-11-03T09:02:00Z' }),
  fila('b', 'email', 'copiar', { sesion: 'b-2', fecha: '2026-11-03T09:03:00Z' }),
  // Alguien que entra directo y pulsa veinte veces lo mismo
  fila('a', 'visita', '', { red: 'Telefonica de Espana', dispositivo: 'móvil' }),
  ...Array.from({ length: 20 }, () => fila('a', 'ejecutar', 'tetris')),
  ...Array.from({ length: 20 }, () => fila('a', 'clic', 'proyectos: Código')),
]

describe('panel de visitas', () => {
  const resumen = resumir(filas, hoy)

  it('cuenta personas, no visitas ni clics repetidos', () => {
    expect(resumen.totales.personas).toBe(2)
    expect(resumen.totales.nuevasHoy).toBe(1)
    expect(resumen.proyectos).toEqual([['tetris', 2]])
    expect(resumen.clics.find(([k]) => k === 'clic: proyectos: Código')).toEqual(['clic: proyectos: Código', 1])
  })

  it('dice de dónde llega cada persona', () => {
    expect(resumen.totales.linkedin).toBe(1)
    expect(resumen.totales.github).toBe(1)
    expect(resumen.origenes).toEqual(
      expect.arrayContaining([
        ['LinkedIn', 1],
        ['GitHub', 1],
        ['Directo', 1],
      ]),
    )
    const b = resumen.ultimas.find((v) => v.origenes.includes('LinkedIn'))!
    expect(b.origenes).toEqual(['LinkedIn', 'GitHub'])
    expect(b.visitas).toBe(2)
    expect(b.empresa).toBe('Indra Sistemas')
    expect(b.acciones).toEqual(['ejecutar: tetris', 'repo: TetrisGame', 'email: copiar'])
    // Una operadora doméstica no dice nada de la empresa
    expect(resumen.ultimas.find((v) => v.origenes.includes('Directo'))!.empresa).toBe('')
  })

  it('reconoce mis enlaces y las webs de origen', () => {
    expect(origen('ref:linkedin')).toBe('LinkedIn')
    expect(origen('lnkd.in')).toBe('LinkedIn')
    expect(origen('github.com')).toBe('GitHub')
    expect(origen('ref:cv')).toBe('cv')
    expect(origen('')).toBe('Directo')
  })

  it('da una fila de personas nuevas por cada uno de los últimos 30 días', () => {
    expect(resumen.porDia).toHaveLength(30)
    expect(resumen.porDia.at(-1)).toEqual(['2026-11-03', 1])
    expect(resumen.porDia.at(-2)).toEqual(['2026-11-02', 1])
  })

  it('compara usuario y clave sin atajos', () => {
    expect(iguales('xxx', 'xxx')).toBe(true)
    expect(iguales('xx', 'xxx')).toBe(false)
  })
})
