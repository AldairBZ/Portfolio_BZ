import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ProgramaCobol } from './interprete'

const FUENTE = readFileSync(resolve(__dirname, '../../../public/apps/blackjack/blackjack.cob.cbl'), 'utf8')
const PUENTE = 'DATA/BRIDGE.DAT'
const MAZO = 'DATA/SHOE.DAT'

/** Lee el registro de 220 caracteres igual que la interfaz original en Python */
function estado(prog: ProgramaCobol) {
  const d = (prog.disco.get(PUENTE) ?? '').replace(/\n$/, '').padEnd(220)
  return {
    estado: d.slice(30, 42).trim(),
    cartasJugador: d.slice(42, 92).trim(),
    puntosJugador: Number(d.slice(92, 94)),
    cartasCrupier: d.slice(94, 144).trim(),
    puntosCrupier: Number(d.slice(144, 146)),
    fichas: Number(d.slice(146, 152)),
    apuesta: Number(d.slice(152, 158)),
    victorias: Number(d.slice(158, 162)),
    partidas: Number(d.slice(162, 166)),
    mensaje: d.slice(166, 190).trim(),
    restantes: Number(d.slice(190, 193)),
  }
}

function enviar(prog: ProgramaCobol, comando: string) {
  const actual = (prog.disco.get(PUENTE) ?? '').replace(/\n$/, '').padEnd(220)
  prog.disco.set(PUENTE, `${comando.padEnd(10)}${'TEST'.padEnd(20)}${actual.slice(30, 220)}\n`)
  prog.ejecutarPrograma()
  return estado(prog)
}

/** Prepara un mazo con un orden conocido: las cartas se reparten jugador, jugador, crupier, crupier… */
function mazoFijo(prog: ProgramaCobol, cartas: string[]) {
  const relleno = Array(312 - cartas.length).fill('2C')
  prog.disco.set(MAZO, `001${[...cartas, ...relleno].join('')}\n`)
}

describe('intérprete COBOL con el BlackJack original', () => {
  it('analiza todos los párrafos y archivos del programa', () => {
    const prog = new ProgramaCobol(FUENTE)
    expect(prog.id).toBe('BLACKJACK')
    expect(prog.estadisticas.parrafos).toBe(32)
    expect(prog.estadisticas.archivos).toEqual(['DATA/BRIDGE.DAT', 'DATA/SHOE.DAT'])
  })

  it('RESETALL crea un mazo de 6 barajas barajado y deja 1000 fichas', () => {
    const prog = new ProgramaCobol(FUENTE)
    const e = enviar(prog, 'RESETALL')
    expect(e).toMatchObject({ estado: 'BETTING', fichas: 1000, apuesta: 0, mensaje: 'PON TU APUESTA' })

    const mazo = prog.disco.get(MAZO)!.slice(3, 3 + 624)
    const cartas = mazo.match(/.{2}/g)!
    expect(cartas).toHaveLength(312)
    // Cada una de las 52 cartas aparece exactamente 6 veces
    const cuenta = new Map<string, number>()
    for (const c of cartas) cuenta.set(c, (cuenta.get(c) ?? 0) + 1)
    expect(cuenta.size).toBe(52)
    expect([...cuenta.values()].every((n) => n === 6)).toBe(true)
    // Y no está en el orden de fábrica
    expect(cartas.slice(0, 4).join('')).not.toBe('ACADAHAS')
  })

  it('acepta apuestas y rechaza las que superan el saldo', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    expect(enviar(prog, 'BET0000100')).toMatchObject({ fichas: 900, apuesta: 100, mensaje: 'APUESTA ACEPTADA' })
    expect(enviar(prog, 'BET0005000')).toMatchObject({ fichas: 900, apuesta: 100, mensaje: 'SIN SALDO' })
  })

  it('no reparte sin apuesta', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    expect(enviar(prog, 'START')).toMatchObject({ estado: 'BETTING', mensaje: 'APUESTA PRIMERO' })
  })

  it('paga el doble con blackjack natural', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    enviar(prog, 'BET0000100')
    mazoFijo(prog, ['AS', 'KH', '9C', '7D'])
    const e = enviar(prog, 'START')
    expect(e).toMatchObject({
      estado: 'PLAYER_WIN',
      cartasJugador: 'AS,KH,',
      puntosJugador: 21,
      mensaje: 'BLACKJACK',
      fichas: 1100,
      victorias: 1,
      partidas: 1,
    })
  })

  it('cuenta los ases como 1 u 11 según convenga', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    enviar(prog, 'BET0000010')
    // Jugador: A + 5 = 16 (blando); al pedir un 9 pasa a 15 (el as vale 1)
    mazoFijo(prog, ['AC', '5D', '0S', '7H', '9C'])
    expect(enviar(prog, 'START').puntosJugador).toBe(16)
    expect(enviar(prog, 'HIT')).toMatchObject({ puntosJugador: 15, estado: 'PLAYING', cartasJugador: 'AC,5D,9C,' })
  })

  it('el jugador se pasa de 21 y pierde la apuesta', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    enviar(prog, 'BET0000050')
    mazoFijo(prog, ['0C', '6D', '9S', '8H', 'KC'])
    enviar(prog, 'START')
    expect(enviar(prog, 'HIT')).toMatchObject({ estado: 'DEALER_WIN', puntosJugador: 26, mensaje: 'TE PASASTE', fichas: 950 })
  })

  it('el crupier pide hasta 17 y se pasa', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    enviar(prog, 'BET0000100')
    // Crupier: 6 + 9 = 15, pide un K y se pasa (25)
    mazoFijo(prog, ['0C', '8D', '6S', '9H', 'KC'])
    enviar(prog, 'START')
    expect(enviar(prog, 'STAND')).toMatchObject({
      estado: 'PLAYER_WIN',
      puntosCrupier: 25,
      cartasCrupier: '6S,9H,KC,',
      mensaje: 'CRUPIER BUST',
      fichas: 1100,
    })
  })

  it('empata y devuelve la apuesta', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    enviar(prog, 'BET0000100')
    mazoFijo(prog, ['0C', '8D', 'QS', '8H'])
    enviar(prog, 'START')
    expect(enviar(prog, 'STAND')).toMatchObject({ estado: 'PUSH', puntosJugador: 18, puntosCrupier: 18, fichas: 1000 })
  })

  it('cuenta las cartas que quedan en el mazo', () => {
    const prog = new ProgramaCobol(FUENTE)
    enviar(prog, 'RESETALL')
    enviar(prog, 'BET0000001')
    expect(enviar(prog, 'START').restantes).toBe(308)
  })
})

describe('semántica de COBOL', () => {
  const programa = (procedimiento: string, datos = '') =>
    new ProgramaCobol(
      [
        '       IDENTIFICATION DIVISION.',
        '       PROGRAM-ID. PRUEBA.',
        '       DATA DIVISION.',
        '       WORKING-STORAGE SECTION.',
        '       01 WS-NUM               PIC 9(3) VALUE 0.',
        '       01 WS-TXT               PIC X(5).',
        '       01 WS-I                 PIC 99.',
        '       01 WS-SALIDA            PIC X(20).',
        '       01 WS-PTR               PIC 99 VALUE 1.',
        datos,
        '       PROCEDURE DIVISION.',
        '       MAIN.',
        procedimiento,
        '           STOP RUN.',
      ].join('\n'),
    )

  it('los campos numéricos truncan por la izquierda y los de texto por la derecha', () => {
    const prog = programa(
      ['           MOVE 12345 TO WS-NUM', '           MOVE "ABCDEFG" TO WS-TXT', '           STRING WS-NUM WS-TXT DELIMITED BY SIZE INTO WS-SALIDA'].join('\n'),
    )
    prog.ejecutarPrograma()
    // 12345 en PIC 9(3) queda 345; "ABCDEFG" en X(5) queda "ABCDE"
    expect(prog.leer('WS-SALIDA')).toBe('345ABCDE            ')
  })

  it('PERFORM VARYING con EXIT PERFORM sale del bucle', () => {
    const prog = programa(
      [
        '           PERFORM VARYING WS-I FROM 1 BY 1 UNTIL WS-I > 50',
        '               ADD 2 TO WS-NUM',
        '               IF WS-NUM >= 10',
        '                   EXIT PERFORM',
        '               END-IF',
        '           END-PERFORM',
      ].join('\n'),
    )
    prog.ejecutarPrograma()
    expect(prog.leer('WS-NUM')).toBe('010')
    expect(prog.leer('WS-I')).toBe('05')
  })

  it('STRING con POINTER avanza el puntero', () => {
    const prog = programa(
      [
        '           STRING "AB," DELIMITED BY SIZE INTO WS-SALIDA WITH POINTER WS-PTR',
        '           STRING "CD," DELIMITED BY SIZE INTO WS-SALIDA WITH POINTER WS-PTR',
      ].join('\n'),
    )
    prog.ejecutarPrograma()
    expect(prog.leer('WS-SALIDA').trim()).toBe('AB,CD,')
    expect(prog.leer('WS-PTR')).toBe('07')
  })

  it('EVALUATE elige la rama correcta y WHEN OTHER como respaldo', () => {
    const prog = programa(
      [
        '           MOVE 7 TO WS-NUM',
        '           EVALUATE WS-NUM',
        '               WHEN 1 MOVE "UNO" TO WS-TXT',
        '               WHEN 7 MOVE "SIETE" TO WS-TXT',
        '               WHEN OTHER MOVE "OTRO" TO WS-TXT',
        '           END-EVALUATE',
      ].join('\n'),
    )
    prog.ejecutarPrograma()
    expect(prog.leer('WS-TXT')).toBe('SIETE')
  })

  it('detiene un bucle infinito en vez de colgar el navegador', () => {
    const prog = programa(['           PERFORM UNTIL WS-NUM > 999', '               CONTINUE', '           END-PERFORM'].join('\n'))
    expect(() => prog.ejecutarPrograma()).toThrow(/bucle infinito/)
  })
})
