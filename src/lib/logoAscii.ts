/*
 * Logos dibujados con caracteres. El trazado SVG del logo (o un texto, si no
 * hay logo) se rasteriza a una rejilla y cada celda elige un carácter según
 * cuánto la cubre la forma. Se pinta una vez; solo se anima al resaltarlo.
 */

const RAMPA = ' .:-=+*<>{}#'
const RUIDO = '01{}<>;=/*+'
const FUENTE = '"IBM Plex Mono", ui-monospace, monospace'

export interface FormaLogo {
  /** Trazado SVG en una caja de 24 x 24 (formato de Simple Icons) */
  ruta?: string
  /** Si no hay trazado, se dibuja este texto */
  texto?: string
  color: string
}

// Colores de marca demasiado oscuros para el fondo se sustituyen por el color del texto
function colorVisible(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  const luz = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return luz < 0.3 ? '#efe8da' : `#${hex.replace('#', '')}`
}

export class LogoAscii {
  private ctx: CanvasRenderingContext2D
  private cobertura: number[][] = []
  private columnas = 0
  private filas = 0
  private celda = 7
  private cuadro = 0
  private inicio = 0
  private resaltado = false
  private color: string
  private redimension: ResizeObserver
  private canvas: HTMLCanvasElement
  private forma: FormaLogo

  constructor(canvas: HTMLCanvasElement, forma: FormaLogo) {
    this.canvas = canvas
    this.forma = forma
    this.ctx = canvas.getContext('2d')!
    this.color = colorVisible(forma.color)
    this.redimension = new ResizeObserver(() => this.preparar())
    this.redimension.observe(canvas)
  }

  destruir() {
    cancelAnimationFrame(this.cuadro)
    this.redimension.disconnect()
  }

  /** Activa el modo resaltado: el logo se vuelve a descifrar con su color de marca */
  resaltar(activo: boolean) {
    if (activo === this.resaltado) return
    this.resaltado = activo
    this.inicio = performance.now()
    cancelAnimationFrame(this.cuadro)
    this.cuadro = requestAnimationFrame(this.animar)
  }

  private preparar() {
    const ancho = this.canvas.clientWidth
    const alto = this.canvas.clientHeight
    if (!ancho || !alto) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(ancho * dpr)
    this.canvas.height = Math.round(alto * dpr)
    this.celda = ancho < 110 ? 4.5 : 5.5
    const celdaAncho = this.celda * 0.6
    this.columnas = Math.floor(ancho / celdaAncho)
    this.filas = Math.floor(alto / this.celda)

    // Se rasteriza a 4 x 4 subpíxeles por celda para medir la cobertura con precisión
    const sub = 4
    const lienzo = document.createElement('canvas')
    lienzo.width = this.columnas * sub
    lienzo.height = this.filas * sub
    const m = lienzo.getContext('2d', { willReadFrequently: true })!
    // El logo ocupa el 80 % del alto, centrado y sin deformar (las celdas no son cuadradas)
    const altoLogo = lienzo.height * 0.88
    const escalaY = altoLogo / 24
    const escalaX = escalaY * (this.celda / celdaAncho) * (lienzo.width / this.columnas / (lienzo.height / this.filas))
    m.fillStyle = '#fff'
    if (this.forma.ruta) {
      m.translate((lienzo.width - 24 * escalaX) / 2, (lienzo.height - altoLogo) / 2)
      m.scale(escalaX, escalaY)
      m.fill(new Path2D(this.forma.ruta))
    } else if (this.forma.texto) {
      const estirado = this.celda / celdaAncho / 1.15
      let tamano = lienzo.height * 0.55
      m.font = `700 ${tamano}px ${FUENTE}`
      // Si el texto no cabe a lo ancho, se reduce hasta ocupar el 90 %
      const anchoTexto = m.measureText(this.forma.texto).width * estirado
      if (anchoTexto > lienzo.width * 0.9) tamano *= (lienzo.width * 0.9) / anchoTexto
      m.font = `700 ${tamano}px ${FUENTE}`
      m.textAlign = 'center'
      m.textBaseline = 'middle'
      m.save()
      m.translate(lienzo.width / 2, lienzo.height / 2)
      m.scale(estirado, 1)
      m.fillText(this.forma.texto, 0, 0)
      m.restore()
    }
    const datos = m.getImageData(0, 0, lienzo.width, lienzo.height).data

    this.cobertura = []
    for (let f = 0; f < this.filas; f++) {
      const fila: number[] = []
      for (let c = 0; c < this.columnas; c++) {
        let suma = 0
        for (let y = 0; y < sub; y++)
          for (let x = 0; x < sub; x++) suma += datos[((f * sub + y) * lienzo.width + c * sub + x) * 4 + 3]
        fila.push(suma / (sub * sub * 255))
      }
      this.cobertura.push(fila)
    }
    this.dibujar(performance.now())
  }

  private animar = (ahora: number) => {
    this.dibujar(ahora)
    if (ahora - this.inicio < 700) this.cuadro = requestAnimationFrame(this.animar)
  }

  private dibujar(ahora: number) {
    const { ctx } = this
    const dpr = this.canvas.width / (this.canvas.clientWidth || 1)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight)
    ctx.font = `${this.celda}px ${FUENTE}`
    ctx.textBaseline = 'top'
    const progreso = this.inicio ? Math.min(1, (ahora - this.inicio) / 600) : 1

    for (let f = 0; f < this.filas; f++) {
      let normal = ''
      let ruido = ''
      for (let c = 0; c < this.columnas; c++) {
        const v = this.cobertura[f][c]
        if (v < 0.08) {
          normal += ' '
          ruido += ' '
          continue
        }
        // Mientras dura la transición, cada celda se descifra en un momento distinto
        const umbral = ((c * 7 + f * 13) % 17) / 17
        if (progreso < umbral) {
          normal += ' '
          ruido += RUIDO[(Math.random() * RUIDO.length) | 0]
        } else {
          normal += RAMPA[Math.max(1, Math.min(RAMPA.length - 1, Math.round(v * (RAMPA.length - 1))))]
          ruido += ' '
        }
      }
      const y = f * this.celda
      ctx.fillStyle = this.resaltado ? this.color : '#b8ae9c'
      ctx.fillText(normal, 0, y)
      if (ruido.trim()) {
        ctx.fillStyle = '#d6502e'
        ctx.fillText(ruido, 0, y)
      }
    }
  }
}
