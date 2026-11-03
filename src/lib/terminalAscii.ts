/*
 * Terminal que reproduce una sesión real de un programa de consola: las
 * respuestas del usuario se teclean letra a letra y la salida aparece línea
 * a línea, con el mismo texto que imprime el programa original.
 */

export type TipoLinea = 'titulo' | 'menu' | 'salida'

/** Una línea de la sesión; `entrada` es lo que escribe el usuario tras el texto */
export interface LineaSesion {
  texto: string
  tipo: TipoLinea
  entrada?: string
}

const FUENTE = '"IBM Plex Mono", ui-monospace, monospace'
const COLORES: Record<TipoLinea | 'entrada', string> = {
  titulo: '#efe8da',
  menu: '#7d7566',
  salida: '#a9c4b1',
  entrada: '#d6502e',
}
const POR_LINEA = 90
const POR_LETRA = 70
const PAUSA_FINAL = 3500

export class TerminalAscii {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private sesion: LineaSesion[]
  /** Momento de la sesión en que termina cada línea */
  private finales: number[] = []
  private duracion = 0
  private reloj = 0
  private anterior = 0
  private visible = false
  private cuadro = 0
  private observador: IntersectionObserver

  constructor(canvas: HTMLCanvasElement, sesion: LineaSesion[]) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.sesion = sesion
    let t = 0
    for (const linea of sesion) {
      t += POR_LINEA + (linea.entrada ? 400 + linea.entrada.length * POR_LETRA : 0)
      this.finales.push(t)
    }
    this.duracion = t + PAUSA_FINAL

    this.observador = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible && !this.cuadro) {
        this.anterior = 0
        this.cuadro = requestAnimationFrame(this.pintar)
      }
    })
    this.observador.observe(canvas)
  }

  destruir() {
    cancelAnimationFrame(this.cuadro)
    this.observador.disconnect()
  }

  private pintar = (ahora: number) => {
    this.cuadro = 0
    if (!this.visible) return
    this.reloj = (this.reloj + (this.anterior ? Math.min(ahora - this.anterior, 50) : 16)) % this.duracion
    this.anterior = ahora
    this.dibujar(ahora)
    this.cuadro = requestAnimationFrame(this.pintar)
  }

  private dibujar(ahora: number) {
    const { ctx, canvas } = this
    const ancho = canvas.clientWidth
    const alto = canvas.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(ancho * dpr) || canvas.height !== Math.round(alto * dpr)) {
      canvas.width = Math.round(ancho * dpr)
      canvas.height = Math.round(alto * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ancho, alto)

    // Tamaño para que quepa la línea más larga del listado (58 caracteres)
    const tam = Math.max(8, Math.min(12.5, (ancho - 28) / 58 / 0.6))
    const interlinea = tam * 1.55
    const margen = tam * 1.2
    ctx.font = `${tam}px ${FUENTE}`
    ctx.textBaseline = 'top'

    // Líneas ya escritas y la que se está escribiendo
    const visibles: { linea: LineaSesion; entrada: string; cursor: boolean }[] = []
    for (let i = 0; i < this.sesion.length; i++) {
      const inicio = i ? this.finales[i - 1] : 0
      if (this.reloj < inicio + POR_LINEA) break
      const linea = this.sesion[i]
      let entrada = linea.entrada ?? ''
      let cursor = false
      if (linea.entrada && this.reloj < this.finales[i]) {
        const letras = Math.floor((this.reloj - inicio - POR_LINEA - 400) / POR_LETRA)
        entrada = linea.entrada.slice(0, Math.max(0, letras))
        cursor = true
      }
      visibles.push({ linea, entrada, cursor })
    }

    // Como un terminal: cuando no cabe, se desplaza hacia arriba
    const caben = Math.floor((alto - margen * 2) / interlinea)
    const desde = Math.max(0, visibles.length - caben)
    const parpadeo = Math.floor(ahora / 500) % 2 === 0
    visibles.slice(desde).forEach(({ linea, entrada, cursor }, i) => {
      const y = margen + i * interlinea
      ctx.fillStyle = COLORES[linea.tipo]
      ctx.fillText(linea.texto, margen, y)
      let x = margen + ctx.measureText(linea.texto).width
      if (entrada) {
        ctx.fillStyle = COLORES.entrada
        ctx.fillText(entrada, x, y)
        x += ctx.measureText(entrada).width
      }
      if (cursor && parpadeo) {
        ctx.fillStyle = COLORES.entrada
        ctx.fillRect(x + 1, y, tam * 0.6, tam * 1.1)
      }
    })
  }
}
