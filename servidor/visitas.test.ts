import { describe, expect, it } from 'vitest'
import { iguales, resumir, type Fila } from './resumen'

const hoy = new Date('2026-11-03T12:00:00Z')
const fila = (sesion: string, evento: string, detalle = '', extra: Partial<Fila> = {}): Fila => ({
  fecha: '2026-11-03T10:00:00Z',
  sesion,
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

// Como en la base de datos: de más reciente a más antiguo
const filas: Fila[] = [
  fila('b', 'email', 'copiar'),
  fila('b', 'repo', 'TetrisGame'),
  fila('b', 'ejecutar', 'tetris'),
  fila('b', 'visita', '', { referencia: 'linkedin.com', red: 'Indra Sistemas' }),
  fila('a', 'ejecutar', 'tetris'),
  fila('a', 'ejecutar', 'tetris'),
  fila('a', 'clic', 'proyectos: Código'),
  fila('a', 'visita', '', { red: 'Telefonica de Espana', dispositivo: 'móvil' }),
]

describe('panel de visitas', () => {
  const resumen = resumir(filas, hoy)

  it('cuenta visitas por persona y proyectos por personas distintas', () => {
    expect(resumen.totales.visitas).toBe(2)
    expect(resumen.totales.proyectos).toBe(3)
    expect(resumen.proyectos).toEqual([['tetris', 2]])
    expect(resumen.repos).toEqual([['TetrisGame', 1]])
  })

  it('reúne todos los clics, incluidos repos y contacto', () => {
    expect(resumen.totales.clics).toBe(3)
    expect(resumen.clics.map(([k]) => k)).toContain('clic: proyectos: Código')
  })

  it('destaca a quien llega de LinkedIn desde la red de una empresa', () => {
    const b = resumen.ultimas.find((v) => v.referencia === 'linkedin.com')!
    expect(b.portal).toBe(true)
    expect(b.empresa).toBe('Indra Sistemas')
    expect(b.acciones).toEqual(['ejecutar: tetris', 'repo: TetrisGame', 'email: copiar'])
    // Una operadora doméstica no dice nada de la empresa
    expect(resumen.ultimas.find((v) => v.referencia === 'directo')!.empresa).toBe('')
    expect(resumen.totales.destacadas).toBe(1)
  })

  it('da una fila por cada uno de los últimos 30 días', () => {
    expect(resumen.porDia).toHaveLength(30)
    expect(resumen.porDia.at(-1)).toEqual(['2026-11-03', 2])
  })

  it('compara usuario y clave sin atajos', () => {
    expect(iguales('xxx', 'xxx')).toBe(true)
    expect(iguales('xx', 'xxx')).toBe(false)
    expect(iguales('', '')).toBe(true)
  })
})
