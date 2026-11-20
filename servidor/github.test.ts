import { describe, expect, it } from 'vitest'
import { esGrande, leerActividad, visible } from './github'

const repo = (name: string, topics: string[] = [], extra = {}) => ({ name, topics, fork: false, private: false, ...extra })

describe('qué repositorios se muestran', () => {
  it('muestra todos mis repositorios públicos, también los nuevos', () => {
    expect(visible(repo('TetrisGame'))).toBe(true)
    expect(visible(repo('ProyectoDeManana'))).toBe(true)
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

describe('qué commits se enseñan', () => {
  const mio = (mensaje: string, padres = 1) => ({ autor: 'AldairBZ', padres, mensaje })

  it('enseña mis commits con cambios de verdad', () => {
    expect(esGrande(mio('Intérprete de COBOL en TypeScript'), { mas: 420, menos: 12, archivos: 6 })).toBe(true)
    expect(esGrande(mio('Corrige el cálculo del total'), { mas: 2, menos: 1, archivos: 3 })).toBe(true)
  })

  it('no enseña limpiezas que casi solo borran', () => {
    expect(esGrande(mio('Quita los compilados'), { mas: 47, menos: 7307, archivos: 300 })).toBe(false)
  })

  it('enseña los que cambian archivos sin líneas, como PDF o imágenes', () => {
    expect(esGrande(mio('CV nuevo en tres idiomas'), { mas: 0, menos: 0, archivos: 4 })).toBe(true)
  })

  it('no enseña los pequeños', () => {
    expect(esGrande(mio('Corrige una errata'), { mas: 1, menos: 1, archivos: 1 })).toBe(false)
  })

  it('no enseña merges ni los mensajes automáticos de GitHub', () => {
    expect(esGrande(mio('Merge pull request #1 from AldairBZ/rama'))).toBe(false)
    expect(esGrande(mio('Une dos ramas', 2))).toBe(false)
    expect(esGrande(mio('Update README.md'))).toBe(false)
    expect(esGrande(mio('Initial commit'))).toBe(false)
  })

  it('no enseña commits de otras personas', () => {
    expect(esGrande({ autor: 'otraPersona', padres: 1, mensaje: 'Algo grande' }, { mas: 900, menos: 0, archivos: 20 })).toBe(false)
    expect(esGrande({ autor: null, padres: 1, mensaje: 'Sin cuenta enlazada' })).toBe(false)
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
