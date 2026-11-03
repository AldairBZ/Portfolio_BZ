/*
 * Planeta dibujado con caracteres. Cada celda de la rejilla calcula si cae
 * dentro de la esfera, qué punto de la superficie ve y cuánta luz recibe,
 * y elige un carácter según esa luz. Todo se pinta con un fillText por fila.
 */

const RAMPA_TIERRA = ' .:-=+*<>{}#%@'
const RAMPA_MAR = ' .,:;~-=≈'

// Ruido de valor 3D con interpolación suave
function hash(x: number, y: number, z: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

const suave = (t: number) => t * t * (3 - 2 * t)
const mezcla = (a: number, b: number, t: number) => a + (b - a) * t

function ruido(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = suave(x - xi)
  const yf = suave(y - yi)
  const zf = suave(z - zi)
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz)
  return mezcla(
    mezcla(mezcla(c(0, 0, 0), c(1, 0, 0), xf), mezcla(c(0, 1, 0), c(1, 1, 0), xf), yf),
    mezcla(mezcla(c(0, 0, 1), c(1, 0, 1), xf), mezcla(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  )
}

const relieve = (x: number, y: number, z: number) =>
  ruido(x * 1.6 + 7, y * 1.6, z * 1.6) * 0.65 + ruido(x * 4 + 3, y * 4, z * 4) * 0.35

export interface OpcionesPlaneta {
  colorTierra: string
  colorMar: string
  colorAnillo: string
  /** Tamaño del carácter en px CSS */
  celda: number
  /** Radio respecto al lado menor del lienzo */
  radio: number
  centroX: number
  centroY: number
  anillo: boolean
}

export class PlanetaAscii {
  private ctx: CanvasRenderingContext2D
  private cuadro = 0
  private giro = 0
  private anterior = 0
  private visible = true
  private observador: IntersectionObserver
  opciones: OpcionesPlaneta
  /** Valores que se pueden animar desde fuera (scroll, ratón) */
  estado = { zoom: 1, velocidad: 1, inclinacionX: 0, inclinacionY: 0, brillo: 1 }

  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement, opciones: Partial<OpcionesPlaneta> = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.opciones = {
      colorTierra: '#efe8da',
      colorMar: '#5f8fc4',
      colorAnillo: '#d6502e',
      celda: 12,
      radio: 0.42,
      centroX: 0.5,
      centroY: 0.5,
      anillo: true,
      ...opciones,
    }
    this.observador = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible && !this.cuadro) this.cuadro = requestAnimationFrame(this.pintar)
    })
    this.observador.observe(canvas)
    this.cuadro = requestAnimationFrame(this.pintar)
  }

  destruir() {
    cancelAnimationFrame(this.cuadro)
    this.observador.disconnect()
  }

  private pintar = (tiempo: number) => {
    this.cuadro = 0
    if (!this.visible) return
    const dt = this.anterior ? Math.min(tiempo - this.anterior, 50) : 16
    this.anterior = tiempo
    this.giro += dt * 0.00018 * this.estado.velocidad
    this.dibujar()
    this.cuadro = requestAnimationFrame(this.pintar)
  }

  private dibujar() {
    const { canvas, ctx, opciones: o, estado } = this
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const ancho = canvas.clientWidth
    const alto = canvas.clientHeight
    if (canvas.width !== Math.round(ancho * dpr) || canvas.height !== Math.round(alto * dpr)) {
      canvas.width = Math.round(ancho * dpr)
      canvas.height = Math.round(alto * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ancho, alto)

    const celdaAlto = o.celda
    const celdaAncho = o.celda * 0.6
    ctx.font = `${celdaAlto}px "IBM Plex Mono", ui-monospace, monospace`
    ctx.textBaseline = 'top'

    const columnas = Math.ceil(ancho / celdaAncho)
    const filas = Math.ceil(alto / celdaAlto)
    const radio = Math.min(ancho, alto) * o.radio * estado.zoom
    const cx = ancho * o.centroX
    const cy = alto * o.centroY

    const cosG = Math.cos(this.giro)
    const sinG = Math.sin(this.giro)
    const inc = 0.35 + estado.inclinacionY
    const cosI = Math.cos(inc)
    const sinI = Math.sin(inc)
    // Luz desde arriba a la izquierda, se mueve un poco con el ratón
    let lx = -0.55 + estado.inclinacionX
    let ly = -0.45
    let lz = 0.7
    const ln = Math.hypot(lx, ly, lz)
    lx /= ln
    ly /= ln
    lz /= ln

    const filaInicio = Math.max(0, Math.floor((cy - radio) / celdaAlto))
    const filaFin = Math.min(filas, Math.ceil((cy + radio) / celdaAlto))
    const colInicio = Math.max(0, Math.floor((cx - radio) / celdaAncho))
    const colFin = Math.min(columnas, Math.ceil((cx + radio) / celdaAncho))

    for (let f = filaInicio; f < filaFin; f++) {
      let tierra = ''
      let mar = ''
      const py = (f * celdaAlto + celdaAlto / 2 - cy) / radio
      for (let c = colInicio; c < colFin; c++) {
        const px = (c * celdaAncho + celdaAncho / 2 - cx) / radio
        const d2 = px * px + py * py
        if (d2 > 1) {
          tierra += ' '
          mar += ' '
          continue
        }
        const pz = Math.sqrt(1 - d2)
        // Inclinación del eje y giro del planeta
        const y1 = py * cosI - pz * sinI
        const z1 = py * sinI + pz * cosI
        const x2 = px * cosG + z1 * sinG
        const z2 = -px * sinG + z1 * cosG
        const luz = Math.max(0, px * lx + py * ly + pz * lz) * estado.brillo
        const alturaTerreno = relieve(x2, y1, z2)
        if (alturaTerreno > 0.52) {
          const i = Math.min(RAMPA_TIERRA.length - 1, Math.floor((luz * 0.85 + (alturaTerreno - 0.52) * 1.2) * RAMPA_TIERRA.length))
          tierra += RAMPA_TIERRA[Math.max(1, i)]
          mar += ' '
        } else {
          const i = Math.min(RAMPA_MAR.length - 1, Math.floor(luz * RAMPA_MAR.length))
          mar += RAMPA_MAR[Math.max(1, i)]
          tierra += ' '
        }
      }
      const x = colInicio * celdaAncho
      const y = f * celdaAlto
      ctx.fillStyle = o.colorMar
      ctx.fillText(mar, x, y)
      ctx.fillStyle = o.colorTierra
      ctx.fillText(tierra, x, y)
    }

    if (o.anillo) this.dibujarAnillo(cx, cy, radio, celdaAlto)
  }

  /** Cinturón de símbolos alrededor del planeta; la mitad de atrás queda tapada */
  private dibujarAnillo(cx: number, cy: number, radio: number, celda: number) {
    const { ctx, opciones: o } = this
    const simbolos = '{}<>;/=+*'
    const total = 90
    ctx.font = `${celda * 0.9}px "IBM Plex Mono", ui-monospace, monospace`
    ctx.fillStyle = o.colorAnillo
    for (let i = 0; i < total; i++) {
      const a = (i / total) * Math.PI * 2 + this.giro * 1.6
      const r = radio * (1.45 + 0.08 * Math.sin(i * 12.9898))
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r * 0.22 - Math.cos(a) * r * 0.08
      const detras = Math.sin(a) < 0
      if (detras && Math.hypot(x - cx, y - cy) < radio) continue
      ctx.globalAlpha = detras ? 0.35 : 0.9
      ctx.fillText(simbolos[i % simbolos.length], x, y)
    }
    ctx.globalAlpha = 1
  }
}
