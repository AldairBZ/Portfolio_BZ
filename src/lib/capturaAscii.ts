/*
 * Captura real de un proyecto dibujada con caracteres, como el retrato.
 * La imagen se reduce a la rejilla: el brillo de cada celda elige el carácter
 * y su color real lo tiñe. Al entrar en pantalla los caracteres se descifran;
 * las páginas largas se recorren despacio y, bajo el cursor, una lente deja
 * ver la captura original.
 */

const RAMPA = ' .:-=+*#%@'
const RUIDO = '01{}<>;=/*+'
const FUENTE = '"IBM Plex Mono", ui-monospace, monospace'
// Una ida o una vuelta del recorrido, en milisegundos
const RECORRIDO = 26000

export interface OpcionesCaptura {
  /** La captura es más alta que la ventana: se recorre de arriba abajo */
  recorrer?: boolean
  /** Texto bajo la lente */
  etiqueta: string
}

export class CapturaAscii {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imagen = new Image()
  private muestra = document.createElement('canvas')
  private m: CanvasRenderingContext2D
  private colores = document.createElement('canvas')
  private c: CanvasRenderingContext2D
  private opciones: OpcionesCaptura
  private columnas = 0
  private filas = 0
  private celdaAlto = 7
  private celdaAncho = 4.2
  private aparece = new Float32Array(0)
  private caracteres: string[] = []
  private ultimoDesplazamiento = -1
  private inicio = 0
  private haEntrado = false
  private visible = false
  private listo = false
  private cuadro = 0
  private anterior = 0
  /** Tiempo de recorrido acumulado: se congela mientras la lente está abierta */
  private reloj = 0
  private lente = { x: -999, y: -999, radio: 0, objetivo: 0 }
  private observador: IntersectionObserver
  private redimension: ResizeObserver

  constructor(canvas: HTMLCanvasElement, src: string, opciones: OpcionesCaptura) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.m = this.muestra.getContext('2d', { willReadFrequently: true })!
    this.c = this.colores.getContext('2d')!
    this.opciones = opciones
    this.imagen.src = src
    this.imagen.decode().then(() => {
      this.listo = true
      this.preparar()
    })

    this.observador = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible && this.listo && !this.haEntrado) this.entrar()
      if (this.visible && !this.cuadro) this.cuadro = requestAnimationFrame(this.pintar)
    })
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
    this.lente.objetivo = Math.min(r.width, r.height) * 0.22
    this.despertar()
  }

  private salir = () => {
    this.lente.objetivo = 0
    this.despertar()
  }

  private soltar = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') this.salir()
  }

  private entrar() {
    this.haEntrado = true
    this.inicio = performance.now()
  }

  private preparar() {
    const ancho = this.canvas.clientWidth
    const alto = this.canvas.clientHeight
    if (!ancho || !alto) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(ancho * dpr)
    this.canvas.height = Math.round(alto * dpr)

    this.celdaAlto = ancho < 360 ? 6 : 7
    this.celdaAncho = this.celdaAlto * 0.6
    this.columnas = Math.floor(ancho / this.celdaAncho)
    this.filas = Math.floor(alto / this.celdaAlto)
    this.muestra.width = this.colores.width = this.columnas
    this.muestra.height = this.colores.height = this.filas
    this.aparece = new Float32Array(this.columnas * this.filas)
    for (let f = 0; f < this.filas; f++) {
      for (let col = 0; col < this.columnas; col++) {
        this.aparece[f * this.columnas + col] = 150 + Math.random() * 1100 + (f / this.filas) * 500
      }
    }
    this.ultimoDesplazamiento = -1
    if (this.visible && !this.haEntrado) this.entrar()
    if (!this.cuadro) this.cuadro = requestAnimationFrame(this.pintar)
  }

  /** Zona de la captura que cabe en la ventana (como object-fit: cover) */
  private zona(desplazamiento: number) {
    const proporcion = (this.columnas * this.celdaAncho) / (this.filas * this.celdaAlto)
    const { naturalWidth: w, naturalHeight: h } = this.imagen
    if (w / h > proporcion) {
      const ancho = h * proporcion
      return { x: (w - ancho) / 2, y: 0, ancho, alto: h }
    }
    const alto = w / proporcion
    return { x: 0, y: (h - alto) * desplazamiento, ancho: w, alto }
  }

  /** Reduce la zona visible a la rejilla: un carácter y un color por celda */
  private muestrear(desplazamiento: number) {
    const { x, y, ancho, alto } = this.zona(desplazamiento)
    const { columnas, filas } = this
    this.m.clearRect(0, 0, columnas, filas)
    this.m.drawImage(this.imagen, x, y, ancho, alto, 0, 0, columnas, filas)
    const datos = this.m.getImageData(0, 0, columnas, filas)
    const p = datos.data

    const brillos = new Float32Array(columnas * filas)
    for (let i = 0; i < brillos.length; i++) {
      brillos[i] = (0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2]) / 255
    }
    // Contraste estirado con el rango real de la zona (percentiles 2 y 98)
    const ordenados = Float32Array.from(brillos).sort()
    const bajo = ordenados[Math.floor(ordenados.length * 0.02)]
    const rango = Math.max(0.08, ordenados[Math.floor(ordenados.length * 0.98)] - bajo)

    this.caracteres = []
    for (let f = 0; f < filas; f++) {
      let linea = ''
      for (let col = 0; col < columnas; col++) {
        const i = f * columnas + col
        // Curva: los fondos planos quedan como textura tenue y los detalles destacan
        const brillo = Math.pow(Math.min(1, Math.max(0, (brillos[i] - bajo) / rango)), 1.35)
        linea += RAMPA[Math.round(brillo * (RAMPA.length - 1))]
        // El color real, aclarado para que se lea sobre el fondo oscuro
        const r = p[i * 4]
        const g = p[i * 4 + 1]
        const b = p[i * 4 + 2]
        const aclarar = Math.min(3, 190 / Math.max(r, g, b, 1))
        p[i * 4] = Math.min(255, r * aclarar * 0.85 + 239 * 0.15)
        p[i * 4 + 1] = Math.min(255, g * aclarar * 0.85 + 232 * 0.15)
        p[i * 4 + 2] = Math.min(255, b * aclarar * 0.85 + 218 * 0.15)
        p[i * 4 + 3] = 255
      }
      this.caracteres.push(linea)
    }
    this.c.putImageData(datos, 0, 0)
    this.ultimoDesplazamiento = desplazamiento
  }

  private pintar = (ahora: number) => {
    this.cuadro = 0
    if (!this.visible || !this.listo || !this.columnas) return
    const dt = this.anterior ? Math.min(ahora - this.anterior, 50) : 16
    this.anterior = ahora
    this.lente.radio += (this.lente.objetivo - this.lente.radio) * 0.18

    let desplazamiento = 0
    if (this.opciones.recorrer) {
      if (this.lente.objetivo === 0) this.reloj += dt
      // Ida y vuelta con pausas arriba y abajo
      const fase = (this.reloj % (RECORRIDO * 2)) / RECORRIDO
      const tramo = fase < 1 ? fase : 2 - fase
      const suave = Math.min(1, Math.max(0, (tramo - 0.1) / 0.8))
      desplazamiento = suave * suave * (3 - 2 * suave)
    }
    if (Math.abs(desplazamiento - this.ultimoDesplazamiento) > 0.0005 || this.ultimoDesplazamiento < 0) {
      this.muestrear(desplazamiento)
    }
    this.dibujar(ahora, desplazamiento)

    // Sin recorrido, descifrado ni lente no hay nada que animar
    const descifrando = !this.haEntrado || ahora - this.inicio < 2000
    if (this.opciones.recorrer || descifrando || this.lente.radio > 0.5 || this.lente.objetivo > 0) {
      this.cuadro = requestAnimationFrame(this.pintar)
    } else {
      this.anterior = 0
    }
  }

  /** Vuelve a animar cuando el cursor entra con la escena quieta */
  despertar() {
    if (this.visible && !this.cuadro) this.cuadro = requestAnimationFrame(this.pintar)
  }

  private dibujar(ahora: number, desplazamiento: number) {
    const { ctx, celdaAlto, celdaAncho, columnas, filas } = this
    const ancho = this.canvas.clientWidth
    const alto = this.canvas.clientHeight
    const dpr = this.canvas.width / ancho
    const ox = (ancho - columnas * celdaAncho) / 2
    const oy = (alto - filas * celdaAlto) / 2
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ancho, alto)
    ctx.font = `${celdaAlto}px ${FUENTE}`
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#fff'

    const transcurrido = this.haEntrado ? ahora - this.inicio : -1
    for (let f = 0; f < filas; f++) {
      let linea = this.caracteres[f]
      if (transcurrido < 2000) {
        // Descifrado: primero nada, luego ruido de código y por fin el carácter
        let nueva = ''
        for (let col = 0; col < columnas; col++) {
          const aparece = this.aparece[f * columnas + col]
          if (transcurrido >= aparece) nueva += linea[col]
          else if (transcurrido > aparece - 450) nueva += RUIDO[(Math.random() * RUIDO.length) | 0]
          else nueva += ' '
        }
        linea = nueva
      }
      ctx.fillText(linea, ox, oy + f * celdaAlto)
    }

    // Cada carácter toma el color real de su celda
    ctx.globalCompositeOperation = 'source-in'
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.colores, ox, oy, columnas * celdaAncho, filas * celdaAlto)
    ctx.globalCompositeOperation = 'source-over'
    ctx.imageSmoothingEnabled = true

    // Lente: bajo el cursor se ve la captura original
    const { x, y, radio } = this.lente
    if (radio > 2) {
      const zona = this.zona(desplazamiento)
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, radio, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(this.imagen, zona.x, zona.y, zona.ancho, zona.alto, ox, oy, columnas * celdaAncho, filas * celdaAlto)
      ctx.restore()
      ctx.strokeStyle = '#d6502e'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, radio, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = `10px ${FUENTE}`
      ctx.fillStyle = '#d6502e'
      ctx.fillText(this.opciones.etiqueta, x - radio * 0.7, y + radio + 6)
    }
  }
}
