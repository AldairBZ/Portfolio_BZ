import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CATALAN } from './catalan'

// Los mismos textos que traducen t('es', 'en') y los objetos { es, en } de la web
const LLAMADA_T = /\bt\(\s*(['"])((?:\\.|(?!\1).)*?)\1\s*,\s*(['"`])(?:\\.|(?!\3).)*?\3\s*,?\s*\)/gs
const OBJETO = /\bes:\s*(['"])((?:\\.|(?!\1).)*?)\1\s*,\s*en:/gs

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    if (statSync(ruta).isDirectory()) return archivos(ruta)
    return /\.tsx?$/.test(nombre) && !nombre.endsWith('.test.ts') && nombre !== 'catalan.ts' ? [ruta] : []
  })
}

const desescapar = (texto: string) => texto.replace(/\\(.)/g, '$1')

describe('catalán', () => {
  it('tiene traducción para cada texto en español de la web', () => {
    const faltan = new Set<string>()
    for (const ruta of archivos('src')) {
      const codigo = readFileSync(ruta, 'utf8')
      for (const patron of [LLAMADA_T, OBJETO]) {
        for (const m of codigo.matchAll(patron)) {
          const es = desescapar(m[2])
          if (!(es in CATALAN)) faltan.add(`${ruta}: ${es}`)
        }
      }
    }
    expect([...faltan]).toEqual([])
  })
})
