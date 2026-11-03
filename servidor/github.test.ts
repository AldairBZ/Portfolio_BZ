import { describe, expect, it } from 'vitest'
import { leerActividad, visible } from './github'

const repo = (name: string, topics: string[] = [], extra = {}) => ({ name, topics, fork: false, private: false, ...extra })

describe('qué repositorios se muestran', () => {
  it('muestra los repositorios con la etiqueta portfolio', () => {
    expect(visible(repo('ProyectoNuevo', ['portfolio', 'java']))).toBe(true)
  })

  it('muestra los de la lista por defecto aunque no tengan etiqueta', () => {
    expect(visible(repo('TetrisGame'))).toBe(true)
  })

  it('oculta los demás repositorios', () => {
    expect(visible(repo('Pruebas'))).toBe(false)
  })

  it('nunca muestra los repositorios personales, aunque se les ponga la etiqueta', () => {
    expect(visible(repo('08-03Love', ['portfolio']))).toBe(false)
    expect(visible(repo('Fther', ['portfolio']))).toBe(false)
  })

  it('ignora forks y repositorios privados', () => {
    expect(visible(repo('TetrisGame', [], { fork: true }))).toBe(false)
    expect(visible(repo('ProyectoNuevo', ['portfolio'], { private: true }))).toBe(false)
  })
})

describe('mapa de actividad', () => {
  it('lee fecha y nivel de cada día en cualquier orden de atributos', () => {
    const html = `
      <h2>312 contributions in the last year</h2>
      <td data-date="2026-11-02" id="d1" data-level="3" class="ContributionCalendar-day"></td>
      <td data-level="0" data-ix="1" data-date="2026-11-01" class="ContributionCalendar-day"></td>`
    expect(leerActividad(html)).toEqual({
      dias: [
        { fecha: '2026-11-01', nivel: 0 },
        { fecha: '2026-11-02', nivel: 3 },
      ],
      total: 312,
    })
  })

  it('devuelve una lista vacía si GitHub cambia el formato', () => {
    expect(leerActividad('<html></html>')).toEqual({ dias: [], total: null })
  })
})
