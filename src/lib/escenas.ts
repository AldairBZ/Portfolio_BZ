/*
 * Ilustraciones generativas de cada proyecto. Cada escena guarda su estado
 * y expone dibujar(ctx, ancho, alto, dt). Se pintan en un canvas que solo
 * se anima mientras está en pantalla.
 */

export type Escena = (ctx: CanvasRenderingContext2D, ancho: number, alto: number, dt: number) => void

const C = {
  tinta: '#0e0d0b',
  tinta3: '#221f17',
  papel: '#efe8da',
  papel2: '#b8ae9c',
  papel3: '#7d7566',
  linea: 'rgba(239,232,218,0.14)',
  bermellon: '#d6502e',
  celadon: '#a9c4b1',
  azul: '#5f8fc4',
  rosa: '#e9b7a6',
}

const MONO = '"Geist Mono Variable", ui-monospace, monospace'

/* Bloques que caen y se apilan; las filas completas desaparecen */
export function escenaBloques(): Escena {
  const COLS = 10
  const FILAS = 18
  const colores = [C.papel, C.bermellon, C.celadon, C.azul, C.rosa, C.papel2]
  const formas = [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ]
  let tablero: (string | null)[][] = Array.from({ length: FILAS }, () => Array(COLS).fill(null))
  let pieza = nueva()
  let reloj = 0
  let destello: number[] = []
  let tiempoDestello = 0

  function nueva() {
    const forma = formas[Math.floor(Math.random() * formas.length)]
    const ancho = Math.max(...forma.map((b) => b[0])) + 1
    return { forma, x: Math.floor(Math.random() * (COLS - ancho + 1)), y: -2, color: colores[Math.floor(Math.random() * colores.length)] }
  }

  const choca = (x: number, y: number) =>
    pieza.forma.some(([bx, by]) => {
      const cx = x + bx
      const cy = y + by
      return cy >= FILAS || cx < 0 || cx >= COLS || (cy >= 0 && tablero[cy][cx])
    })

  function paso() {
    if (destello.length) return
    if (!choca(pieza.x, pieza.y + 1)) {
      pieza.y++
      return
    }
    for (const [bx, by] of pieza.forma) {
      if (pieza.y + by < 0) {
        tablero = tablero.map(() => Array(COLS).fill(null))
        pieza = nueva()
        return
      }
      tablero[pieza.y + by][pieza.x + bx] = pieza.color
    }
    destello = tablero.map((fila, i) => (fila.every(Boolean) ? i : -1)).filter((i) => i >= 0)
    // Rellena huecos al azar para que las filas se completen a menudo
    if (!destello.length && Math.random() < 0.35) {
      const fila = tablero.findLastIndex((f) => f.some(Boolean) && f.some((c) => !c))
      if (fila >= 0) {
        const vacia = tablero[fila].findIndex((c) => !c)
        tablero[fila][vacia] = C.papel3
      }
    }
    pieza = nueva()
  }

  return (ctx, ancho, alto, dt) => {
    reloj += dt
    if (reloj > 90) {
      reloj = 0
      paso()
    }
    if (destello.length) {
      tiempoDestello += dt
      if (tiempoDestello > 260) {
        tablero = tablero.filter((_, i) => !destello.includes(i))
        while (tablero.length < FILAS) tablero.unshift(Array(COLS).fill(null))
        destello = []
        tiempoDestello = 0
      }
    }

    const lado = Math.floor(Math.min(ancho / (COLS + 2), alto / (FILAS + 2)))
    const ox = Math.round((ancho - lado * COLS) / 2)
    const oy = Math.round((alto - lado * FILAS) / 2)
    ctx.clearRect(0, 0, ancho, alto)
    ctx.strokeStyle = C.linea
    ctx.lineWidth = 1
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath()
      ctx.moveTo(ox + x * lado + 0.5, oy)
      ctx.lineTo(ox + x * lado + 0.5, oy + FILAS * lado)
      ctx.stroke()
    }
    for (let y = 0; y <= FILAS; y++) {
      ctx.beginPath()
      ctx.moveTo(ox, oy + y * lado + 0.5)
      ctx.lineTo(ox + COLS * lado, oy + y * lado + 0.5)
      ctx.stroke()
    }
    const celda = (x: number, y: number, color: string) => {
      ctx.fillStyle = color
      ctx.fillRect(ox + x * lado + 2, oy + y * lado + 2, lado - 3, lado - 3)
    }
    tablero.forEach((fila, y) =>
      fila.forEach((color, x) => {
        if (color) celda(x, y, destello.includes(y) ? (Math.floor(tiempoDestello / 60) % 2 ? C.papel : C.bermellon) : color)
      }),
    )
    for (const [bx, by] of pieza.forma) if (pieza.y + by >= 0) celda(pieza.x + bx, pieza.y + by, pieza.color)
  }
}

/* Tabla de inventario que se actualiza con entradas y salidas de stock */
export function escenaInventario(): Escena {
  const productos = ['Barra de pan', 'Croissant', 'Ensaïmada', 'Coca de recapte', 'Magdalena', 'Pa de pagès', 'Panellet', 'Napolitana']
  const stock = productos.map(() => 10 + Math.floor(Math.random() * 30))
  const registro: { texto: string; tipo: 'entrada' | 'salida'; vida: number }[] = []
  let reloj = 0
  let ultimo = -1

  return (ctx, ancho, alto, dt) => {
    reloj += dt
    if (reloj > 650) {
      reloj = 0
      const i = Math.floor(Math.random() * productos.length)
      const entrada = Math.random() < 0.45 || stock[i] < 6
      const cantidad = 1 + Math.floor(Math.random() * (entrada ? 12 : 6))
      stock[i] = Math.max(0, Math.min(48, stock[i] + (entrada ? cantidad : -cantidad)))
      ultimo = i
      registro.unshift({
        texto: `INSERT movimiento (${i + 1}, ${entrada ? '+' : '-'}${cantidad}, '${entrada ? 'entrada' : 'salida'}')`,
        tipo: entrada ? 'entrada' : 'salida',
        vida: 0,
      })
      registro.length = Math.min(registro.length, 6)
    }
    registro.forEach((r) => (r.vida += dt))

    ctx.clearRect(0, 0, ancho, alto)
    const tam = Math.max(9, Math.min(14, ancho / 30))
    const alturaLinea = tam * 1.9
    ctx.font = `${tam}px ${MONO}`
    ctx.textBaseline = 'middle'
    const margen = tam * 1.6
    let y = margen

    ctx.fillStyle = C.papel3
    ctx.fillText('sqlite> SELECT nombre, stock FROM productos;', margen, y)
    y += alturaLinea * 1.3

    const anchoBarra = ancho - margen * 2 - tam * 12
    productos.forEach((nombre, i) => {
      ctx.fillStyle = i === ultimo ? C.papel : C.papel2
      ctx.fillText(nombre.padEnd(16, ' ').slice(0, 15), margen, y)
      const largo = (stock[i] / 48) * anchoBarra
      ctx.fillStyle = i === ultimo ? C.bermellon : C.linea
      ctx.fillRect(margen + tam * 9.5, y - tam * 0.35, largo, tam * 0.7)
      ctx.fillStyle = C.papel2
      ctx.fillText(String(stock[i]).padStart(2, ' '), margen + tam * 10 + anchoBarra, y)
      y += alturaLinea
    })

    y += alturaLinea * 0.5
    registro.forEach((r, i) => {
      ctx.globalAlpha = Math.max(0, 1 - i * 0.17) * Math.min(1, r.vida / 200)
      ctx.fillStyle = r.tipo === 'entrada' ? C.celadon : C.rosa
      ctx.fillText(r.texto.slice(0, Math.floor((ancho - margen * 2) / (tam * 0.6))), margen, y)
      y += alturaLinea * 0.85
    })
    ctx.globalAlpha = 1
  }
}

/* Rejilla de píxeles: una forma se mueve y se resaltan los píxeles que cambian */
export function escenaPixeles(): Escena {
  const COLS = 40
  const FILAS = 30
  let anterior: Uint8Array = new Uint8Array(COLS * FILAS)
  let t = 0

  return (ctx, ancho, alto, dt) => {
    t += dt * 0.001
    const actual = new Uint8Array(COLS * FILAS)
    const bx = COLS / 2 + Math.sin(t * 1.3) * COLS * 0.28
    const by = FILAS / 2 + Math.sin(t * 0.9 + 1) * FILAS * 0.26
    const r = 6 + Math.sin(t * 2.1) * 1.5
    let cambiados = 0
    for (let y = 0; y < FILAS; y++) {
      for (let x = 0; x < COLS; x++) {
        const dentro = (x - bx) ** 2 + ((y - by) * 1.1) ** 2 < r * r
        actual[y * COLS + x] = dentro ? 1 : 0
      }
    }

    const lado = Math.floor(Math.min(ancho / (COLS + 2), alto / (FILAS + 6)))
    const ox = Math.round((ancho - lado * COLS) / 2)
    const oy = Math.round((alto - lado * FILAS) / 2) - lado
    ctx.clearRect(0, 0, ancho, alto)
    for (let y = 0; y < FILAS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x
        const cambio = actual[i] !== anterior[i]
        if (cambio) cambiados++
        // Ruido estable para que parezca una imagen de cámara
        const grano = ((x * 73 + y * 151) % 17) / 17
        ctx.fillStyle = cambio ? C.bermellon : actual[i] ? C.papel2 : `rgba(239,232,218,${0.05 + grano * 0.08})`
        ctx.fillRect(ox + x * lado, oy + y * lado, lado - 1, lado - 1)
      }
    }
    anterior = actual

    ctx.font = `${Math.max(10, lado * 1.3)}px ${MONO}`
    ctx.textBaseline = 'top'
    ctx.fillStyle = C.papel2
    ctx.fillText(`AbsDiff → umbral 25 → ${String(cambiados).padStart(3, ' ')} px`, ox, oy + FILAS * lado + lado)
  }
}

/* Tarjeta perforada de 80 columnas que se va perforando con una línea de COBOL */
export function escenaTarjeta(): Escena {
  const lineas = [
    'COMPUTE WS-TOTAL = WS-TOTAL + WS-CARTA.',
    'IF WS-TOTAL > 21 PERFORM PASADO.',
    'MOVE WS-APUESTA TO WS-GANANCIA.',
    'PERFORM REPARTIR-CARTA UNTIL FIN.',
    'DISPLAY "BLACKJACK" UPON CONSOLE.',
  ]
  let linea = 0
  let columna = 0
  let reloj = 0
  let pausa = 0

  // Codificación Hollerith simplificada: filas perforadas por carácter
  const filasDe = (car: string) => {
    if (car === ' ') return []
    if (/[0-9]/.test(car)) return [Number(car) + 2]
    if (/[A-I]/.test(car)) return [0, car.charCodeAt(0) - 64 + 2]
    if (/[J-R]/.test(car)) return [1, car.charCodeAt(0) - 73 + 2]
    if (/[S-Z]/.test(car)) return [2, car.charCodeAt(0) - 81 + 2]
    return [1, 10]
  }

  return (ctx, ancho, alto, dt) => {
    if (pausa > 0) {
      pausa -= dt
      if (pausa <= 0) {
        linea = (linea + 1) % lineas.length
        columna = 0
      }
    } else {
      reloj += dt
      if (reloj > 55) {
        reloj = 0
        columna++
        if (columna >= lineas[linea].length) pausa = 1600
      }
    }

    ctx.clearRect(0, 0, ancho, alto)
    const COLS = 40
    const FILAS = 12
    const anchoTarjeta = Math.min(ancho * 0.9, 640)
    const paso = anchoTarjeta / (COLS + 2)
    const altoTarjeta = paso * (FILAS + 4)
    const ox = (ancho - anchoTarjeta) / 2
    const oy = (alto - altoTarjeta) / 2

    ctx.save()
    ctx.translate(ancho / 2, alto / 2)
    ctx.rotate(-0.06)
    ctx.translate(-ancho / 2, -alto / 2)
    ctx.fillStyle = '#e8dcc0'
    ctx.beginPath()
    ctx.moveTo(ox + paso * 1.5, oy)
    ctx.lineTo(ox + anchoTarjeta, oy)
    ctx.lineTo(ox + anchoTarjeta, oy + altoTarjeta)
    ctx.lineTo(ox, oy + altoTarjeta)
    ctx.lineTo(ox, oy + paso * 1.5)
    ctx.closePath()
    ctx.fill()

    const texto = lineas[linea]
    ctx.font = `${paso * 0.85}px ${MONO}`
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#5b4a33'
    ctx.fillText(texto.slice(0, columna), ox + paso, oy + paso * 1.4)

    for (let c = 0; c < COLS; c++) {
      const car = texto[c] ?? ' '
      const perforadas = c < columna ? filasDe(car.toUpperCase()) : []
      for (let f = 0; f < FILAS; f++) {
        const x = ox + paso * (c + 1)
        const y = oy + paso * (f + 3)
        if (perforadas.includes(f)) {
          ctx.fillStyle = C.tinta
          ctx.fillRect(x + paso * 0.2, y + paso * 0.1, paso * 0.6, paso * 0.8)
        } else if (f > 1) {
          ctx.fillStyle = '#b9a98a'
          ctx.font = `${paso * 0.45}px ${MONO}`
          ctx.fillText(String(f - 2), x + paso * 0.3, y + paso * 0.5)
        }
      }
    }
    if (columna < COLS && pausa <= 0) {
      ctx.fillStyle = C.bermellon
      ctx.fillRect(ox + paso * (columna + 1), oy + paso * 2.6, paso * 0.9, paso * (FILAS + 0.6))
    }
    ctx.restore()
  }
}

/* Maqueta responsive: la misma página se recoloca al cambiar de ancho */
export function escenaMaqueta(): Escena {
  let t = 0
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k

  return (ctx, ancho, alto, dt) => {
    t += dt * 0.00035
    // Oscila entre escritorio (0) y móvil (1) con pausas en los extremos
    const fase = (Math.sin(t * Math.PI * 2) + 1) / 2
    const k = fase < 0.15 ? 0 : fase > 0.85 ? 1 : (fase - 0.15) / 0.7
    const e = k * k * (3 - 2 * k)

    ctx.clearRect(0, 0, ancho, alto)
    const altoMarco = alto * 0.82
    const anchoMarco = lerp(Math.min(ancho * 0.9, altoMarco * 1.45), altoMarco * 0.5, e)
    const x0 = (ancho - anchoMarco) / 2
    const y0 = (alto - altoMarco) / 2
    const radio = lerp(8, 22, e)

    ctx.strokeStyle = C.papel2
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(x0, y0, anchoMarco, altoMarco, radio)
    ctx.stroke()

    const p = anchoMarco * 0.06
    const interior = anchoMarco - p * 2
    let y = y0 + p
    const caja = (x: number, yy: number, w: number, h: number, color: string, relleno = true) => {
      ctx.beginPath()
      ctx.roundRect(x, yy, w, h, 3)
      if (relleno) {
        ctx.fillStyle = color
        ctx.fill()
      } else {
        ctx.strokeStyle = color
        ctx.stroke()
      }
    }

    // Cabecera: menú completo en escritorio, icono en móvil
    caja(x0 + p, y, interior * 0.22, p * 0.6, C.bermellon)
    const enlaces = Math.round(lerp(4, 0, e))
    for (let i = 0; i < enlaces; i++) caja(x0 + p + interior * (0.5 + i * 0.13), y, interior * 0.09, p * 0.6, C.papel3)
    if (e > 0.6) for (let i = 0; i < 3; i++) caja(x0 + p + interior * 0.82, y + i * p * 0.24, interior * 0.18, p * 0.12, C.papel3)
    y += p * 1.6

    // Portada con vídeo de fondo
    const altoPortada = lerp(altoMarco * 0.32, altoMarco * 0.24, e)
    caja(x0 + p, y, interior, altoPortada, 'rgba(214,80,46,0.18)')
    caja(x0 + p * 2, y + altoPortada * 0.35, interior * lerp(0.45, 0.8, e), p * 0.7, C.papel)
    caja(x0 + p * 2, y + altoPortada * 0.35 + p, interior * lerp(0.3, 0.55, e), p * 0.35, C.papel3)
    y += altoPortada + p

    // Tarjetas: tres columnas que pasan a una
    const columnas = e < 0.5 ? 3 : 1
    const hueco = p * 0.6
    const anchoTarjeta = (interior - hueco * (columnas - 1)) / columnas
    const altoTarjeta = lerp(altoMarco * 0.28, altoMarco * 0.13, e)
    for (let i = 0; i < 3; i++) {
      const col = i % columnas
      const fila = Math.floor(i / columnas)
      const tx = x0 + p + col * (anchoTarjeta + hueco)
      const ty = y + fila * (altoTarjeta + hueco)
      if (ty + altoTarjeta > y0 + altoMarco - p) break
      caja(tx, ty, anchoTarjeta, altoTarjeta, C.linea, false)
      caja(tx + hueco, ty + hueco, anchoTarjeta * 0.5, p * 0.35, C.papel2)
    }

    ctx.font = `${Math.max(10, Math.min(13, ancho / 40))}px ${MONO}`
    ctx.fillStyle = C.papel3
    ctx.textBaseline = 'top'
    ctx.fillText(`@media (max-width: ${Math.round(lerp(1280, 390, e))}px)`, x0, y0 + altoMarco + 10)
  }
}

export const escenas = {
  bloques: escenaBloques,
  inventario: escenaInventario,
  pixeles: escenaPixeles,
  tarjeta: escenaTarjeta,
  maqueta: escenaMaqueta,
}

export type NombreEscena = keyof typeof escenas | 'planeta'
