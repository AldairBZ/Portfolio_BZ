/*
 * Retrato en caracteres. La foto (ya recortada, con transparencia) se reduce
 * a una rejilla; cada celda elige un carácter según su brillo. Al entrar en
 * pantalla los caracteres se "descifran", una línea de escaneo recorre el
 * retrato y, bajo el cursor, una lente deja ver la foto real.
 */

const RAMPA = ' .:-=+*<>{}#%@'
const RUIDO = '01{}<>;=/*+'
const FUENTE = '"IBM Plex Mono", ui-monospace, monospace'

interface Celda {
  caracter: string
  /** 0 = sombra, 1 = medio, 2 = luz */
  tono: number
  /** Momento (ms) en que la celda termina de descifrarse */
  aparece: number
}

export class RetratoAscii {
  private ctx: CanvasRenderingContext2D
  private imagen = new Image()
  private celdas: (Celda | null)[][] = []
  private columnas = 0
  private filas = 0
  private celdaAlto = 9
  private celdaAncho = 5.4
  private inicio = 0
  private cuadro = 0
  private visible = false
  private haEntrado = false
  private lente = { x: -999, y: -999, radio: 0, objetivo: 0 }
  private observador: IntersectionObserver
  private redimension: ResizeObserver
  private listo = false

  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement, src: string) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.imagen.src = src
    this.imagen.decode().then(() => {
      this.listo = true
      this.preparar()
    })

    this.observador = new IntersectionObserver(
      ([e]) => {
        this.visible = e.isIntersecting
        if (this.visible && !this.haEntrado && this.listo) {
          this.haEntrado = true
          this.inicio = performance.now()
        }
        if (this.visible && !this.cuadro) this.cuadro = requestAnimationFrame(this.pintar)
      },
      { threshold: 0.25 },
    )
    this.observador.observe(canvas)
    this.redimension = new ResizeObserver(() => this.listo && this.preparar())
    this.redimension.observe(canvas)

    canvas.addEventListener('pointermove', this.mover)
    canvas.addEventListener('pointerdown', this.mover)
    canvas.addEventListener('pointerleave', this.salir)
    canvas.addEventListener('pointerup', this.soltar)
  }

  destruir() {
    cancelAnimationFrame(this.cuadro)
    this.observador.disconnect()
    this.redimension.disconnect()
    this.canvas.removeEventListener('pointermove', this.mover)
    this.canvas.removeEventListener('pointerdown', this.mover)
    this.canvas.removeEventListener('pointerleave', this.salir)
    this.canvas.removeEventListener('pointerup', this.soltar)
  }

  private mover = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect()
    this.lente.x = e.clientX - r.left
    this.lente.y = e.clientY - r.top
    this.lente.objetivo = Math.min(r.width, r.height) * 0.17
  }

  private salir = () => {
    this.lente.objetivo = 0
  }

  private soltar = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') this.lente.objetivo = 0
  }

  /** Muestrea la foto a la resolución de la rejilla */
  private preparar() {
    const ancho = this.canvas.clientWidth
    const alto = this.canvas.clientHeight
    if (!ancho || !alto) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(ancho * dpr)
    this.canvas.height = Math.round(alto * dpr)

    this.celdaAlto = ancho < 420 ? 6.5 : 8
    this.celdaAncho = this.celdaAlto * 0.6
    this.columnas = Math.floor(ancho / this.celdaAncho)
    this.filas = Math.floor(alto / this.celdaAlto)

    const muestra = document.createElement('canvas')
    muestra.width = this.columnas
    muestra.height = this.filas
    const m = muestra.getContext('2d', { willReadFrequently: true })!
    m.drawImage(this.imagen, 0, 0, this.columnas, this.filas)
    const datos = m.getImageData(0, 0, this.columnas, this.filas).data

    // Estira el contraste con el rango real de la silueta (percentiles 3 y 99)
    const brillos: number[] = []
    for (let i = 0; i < datos.length; i += 4) if (datos[i + 3] > 127) brillos.push(datos[i])
    brillos.sort((a, b) => a - b)
    const bajo = brillos[Math.floor(brillos.length * 0.03)] ?? 0
    const alto2 = brillos[Math.floor(brillos.length * 0.99)] ?? 255
    const rango = Math.max(1, alto2 - bajo)

    this.celdas = []
    for (let f = 0; f < this.filas; f++) {
      const fila: (Celda | null)[] = []
      for (let c = 0; c < this.columnas; c++) {
        const i = (f * this.columnas + c) * 4
        const alfa = datos[i + 3] / 255
        if (alfa < 0.5) {
          fila.push(null)
          continue
        }
        // Curva de contraste: el jersey negro queda como textura tenue, la cara con detalle
        const normal = Math.min(1, Math.max(0, (datos[i] - bajo) / rango))
        const brillo = Math.pow(normal, 1.15)
        const indice = Math.max(1, Math.min(RAMPA.length - 1, Math.round(brillo * (RAMPA.length - 1))))
        fila.push({
          caracter: RAMPA[indice],
          tono: brillo < 0.22 ? 0 : brillo < 0.55 ? 1 : 2,
          aparece: 200 + Math.random() * 1300 + (f / this.filas) * 500,
        })
      }
      this.celdas.push(fila)
    }
    if (this.visible && !this.haEntrado) {
      this.haEntrado = true
      this.inicio = performance.now()
    }
    if (!this.cuadro) this.cuadro = requestAnimationFrame(this.pintar)
  }

  private pintar = (ahora: number) => {
    this.cuadro = 0
    if (!this.visible || !this.listo) return
    this.lente.radio += (this.lente.objetivo - this.lente.radio) * 0.18
    this.dibujar(ahora)
    this.cuadro = requestAnimationFrame(this.pintar)
  }

  private dibujar(ahora: number) {
    const { ctx, celdaAlto, celdaAncho } = this
    const dpr = this.canvas.width / this.canvas.clientWidth
    const ancho = this.canvas.clientWidth
    const alto = this.canvas.clientHeight
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ancho, alto)
    ctx.font = `${celdaAlto}px ${FUENTE}`
    ctx.textBaseline = 'top'

    const transcurrido = this.haEntrado ? ahora - this.inicio : 0
    // Línea de escaneo: baja cada 7 segundos
    const escaneo = ((ahora / 7000) % 1) * (this.filas + 40) - 20
    const colores = ['#5c564b', '#b8ae9c', '#efe8da', '#d6502e']

    for (let f = 0; f < this.filas; f++) {
      const lineas = ['', '', '', '']
      const fila = this.celdas[f]
      const enEscaneo = Math.abs(f - escaneo) < 1.5
      for (let c = 0; c < this.columnas; c++) {
        const celda = fila[c]
        let caracter = ' '
        let tono = -1
        if (celda) {
          if (!this.haEntrado || transcurrido < celda.aparece) {
            // Aún sin descifrar: ruido de código
            if (this.haEntrado && transcurrido > celda.aparece - 500) {
              caracter = RUIDO[(Math.random() * RUIDO.length) | 0]
              tono = 3
            }
          } else {
            caracter = celda.caracter
            tono = enEscaneo ? 3 : celda.tono
          }
        }
        for (let t = 0; t < 4; t++) lineas[t] += t === tono ? caracter : ' '
      }
      const y = f * celdaAlto
      for (let t = 0; t < 4; t++) {
        if (!lineas[t].trim()) continue
        ctx.fillStyle = colores[t]
        ctx.fillText(lineas[t], 0, y)
      }
    }

    // Lente: bajo el cursor se ve la foto real
    const { x, y, radio } = this.lente
    if (radio > 2) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, radio, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(this.imagen, 0, 0, this.columnas * celdaAncho, this.filas * celdaAlto)
      // Rejilla fina encima para que se note que es el mismo dato
      ctx.fillStyle = 'rgba(14,13,11,0.18)'
      for (let ly = 0; ly < alto; ly += 3) ctx.fillRect(x - radio, ly, radio * 2, 1)
      ctx.restore()
      ctx.strokeStyle = '#d6502e'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, radio, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `10px ${FUENTE}`
      ctx.fillStyle = '#d6502e'
      ctx.fillText('retrato.webp', x - radio * 0.7, y + radio + 6)
    }
  }
}
