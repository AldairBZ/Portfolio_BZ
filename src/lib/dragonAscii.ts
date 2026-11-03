/*
 * Dragón oriental dibujado con caracteres que sigue al cursor. El cuerpo es
 * una cadena de nodos: la cabeza persigue al ratón y cada nodo sigue al
 * anterior a distancia fija. En cada cuadro se rasteriza a la rejilla de
 * caracteres (cuerpo, aletas, patas, cuernos y bigotes) y se pinta una línea
 * de texto por fila y por tono, como el planeta y el retrato.
 */

const RAMPA = ' .:-=+*#%@'
const FUENTE = '"IBM Plex Mono", ui-monospace, monospace'
const NODOS = 52
const DISTANCIA = 9
// Tonos: cuerpo, aletas, bigotes, ojo
const COLORES = ['#7d7566', '#b8ae9c', '#e9b7a6', '#d6502e']

interface Punto {
  x: number
  y: number
}

export class DragonAscii {
  private canvas: HTMLCanvasElement
  private zona: HTMLElement
  private ctx: CanvasRenderingContext2D
  private nodos: Punto[] = []
  private objetivo: Punto = { x: 0, y: 0 }
  private raton: Punto | null = null
  private ultimoRaton = 0
  /** Las medidas del dragón están en unidades propias; esto las pasa a píxeles */
  private escala = 1
  private celdaAlto = 10
  private celdaAncho = 6
  private columnas = 0
  private filas = 0
  private densidad = new Float32Array(0)
  private tono = new Uint8Array(0)
  private visible = false
  private cuadro = 0
  private anterior = 0
  private reloj = 0
  private lento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private observador: IntersectionObserver
  private redimension: ResizeObserver

  /** `zona` es el elemento donde se sigue al cursor; el canvas lo cubre entero */
  constructor(canvas: HTMLCanvasElement, zona: HTMLElement) {
    this.canvas = canvas
    this.zona = zona
    this.ctx = canvas.getContext('2d')!
    this.preparar()
    const { ancho, alto } = this.medidas()
    for (let i = 0; i < NODOS; i++) this.nodos.push({ x: (ancho * 0.8) / this.escala + i * DISTANCIA, y: (alto * 0.45) / this.escala })

    this.observador = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible && !this.cuadro) {
        this.anterior = 0
        this.cuadro = requestAnimationFrame(this.pintar)
      }
    })
    this.observador.observe(canvas)
    this.redimension = new ResizeObserver(() => this.preparar())
    this.redimension.observe(canvas)
    zona.addEventListener('pointermove', this.mover)
    zona.addEventListener('pointerdown', this.mover)
    zona.addEventListener('pointerleave', this.salir)
  }

  destruir() {
    cancelAnimationFrame(this.cuadro)
    this.observador.disconnect()
    this.redimension.disconnect()
    this.zona.removeEventListener('pointermove', this.mover)
    this.zona.removeEventListener('pointerdown', this.mover)
    this.zona.removeEventListener('pointerleave', this.salir)
  }

  private mover = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect()
    this.raton = { x: (e.clientX - r.left) / this.escala, y: (e.clientY - r.top) / this.escala }
    this.ultimoRaton = performance.now()
  }

  private salir = () => {
    this.raton = null
  }

  private medidas() {
    return { ancho: this.canvas.clientWidth, alto: this.canvas.clientHeight }
  }

  private preparar() {
    const { ancho, alto } = this.medidas()
    if (!ancho || !alto) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(ancho * dpr)
    this.canvas.height = Math.round(alto * dpr)
    // Grande en escritorio, más contenido en el móvil
    this.escala = Math.min(2.2, Math.max(0.9, ancho / 820))
    this.celdaAlto = ancho < 600 ? 7 : 8
    this.celdaAncho = this.celdaAlto * 0.6
    this.columnas = Math.ceil(ancho / this.celdaAncho)
    this.filas = Math.ceil(alto / this.celdaAlto)
    this.densidad = new Float32Array(this.columnas * this.filas)
    this.tono = new Uint8Array(this.columnas * this.filas)
  }

  private pintar = (ahora: number) => {
    this.cuadro = 0
    if (!this.visible) return
    const dt = this.anterior ? Math.min(ahora - this.anterior, 50) : 16
    this.anterior = ahora
    this.reloj += dt * (this.lento ? 0.4 : 1)
    this.avanzar(ahora, dt)
    this.rasterizar()
    this.dibujar()
    this.cuadro = requestAnimationFrame(this.pintar)
  }

  private avanzar(ahora: number, dt: number) {
    const ancho = this.medidas().ancho / this.escala
    const alto = this.medidas().alto / this.escala
    const reciente = this.raton && ahora - this.ultimoRaton < 4000
    if (reciente && this.raton) {
      this.objetivo = this.raton
    } else {
      // Sin cursor, vuela despacio por la derecha, lejos del texto
      const t = this.reloj / 1000
      this.objetivo = {
        x: ancho * (0.72 + 0.18 * Math.sin(t * 0.31)),
        y: alto * (0.42 + 0.26 * Math.sin(t * 0.53 + 1)),
      }
    }
    const cabeza = this.nodos[0]
    const dx = this.objetivo.x - cabeza.x
    const dy = this.objetivo.y - cabeza.y
    const distancia = Math.hypot(dx, dy)
    // Persigue con inercia y una velocidad máxima: se mueve como un animal, no como un cursor
    const maxima = (reciente ? 0.55 : 0.18) * dt
    const paso = Math.min(distancia * 0.06 * (dt / 16), maxima)
    if (distancia > 1) {
      cabeza.x += (dx / distancia) * paso
      cabeza.y += (dy / distancia) * paso
    }
    for (let i = 1; i < NODOS; i++) {
      const a = this.nodos[i - 1]
      const b = this.nodos[i]
      const ex = b.x - a.x
      const ey = b.y - a.y
      const largo = Math.hypot(ex, ey) || 1
      b.x = a.x + (ex / largo) * DISTANCIA
      b.y = a.y + (ey / largo) * DISTANCIA
    }
  }

  /** Posición de cada nodo con una ondulación de serpiente encima */
  private cuerpo(): (Punto & { nx: number; ny: number })[] {
    const t = this.reloj / 1000
    return this.nodos.map((p, i) => {
      const a = this.nodos[Math.max(0, i - 1)]
      const b = this.nodos[Math.min(NODOS - 1, i + 1)]
      const largo = Math.hypot(a.x - b.x, a.y - b.y) || 1
      // Normal a la dirección del cuerpo
      const nx = -(a.y - b.y) / largo
      const ny = (a.x - b.x) / largo
      const onda = Math.sin(t * 3 - i * 0.32) * Math.min(1, i / 8) * 5
      return { x: p.x + nx * onda, y: p.y + ny * onda, nx, ny }
    })
  }

  private sellar(xModelo: number, yModelo: number, radioModelo: number, fuerza: number, tono: number) {
    const x = xModelo * this.escala
    const y = yModelo * this.escala
    const radio = radioModelo * this.escala
    const { celdaAncho, celdaAlto, columnas, filas } = this
    const c0 = Math.max(0, Math.floor((x - radio) / celdaAncho))
    const c1 = Math.min(columnas - 1, Math.ceil((x + radio) / celdaAncho))
    const f0 = Math.max(0, Math.floor((y - radio) / celdaAlto))
    const f1 = Math.min(filas - 1, Math.ceil((y + radio) / celdaAlto))
    for (let f = f0; f <= f1; f++) {
      for (let c = c0; c <= c1; c++) {
        const d = Math.hypot((c + 0.5) * celdaAncho - x, (f + 0.5) * celdaAlto - y) / radio
        if (d > 1) continue
        const valor = fuerza * (1 - d * d * 0.7)
        const i = f * columnas + c
        if (valor > this.densidad[i] || tono === 3) {
          this.densidad[i] = Math.max(valor, this.densidad[i])
          this.tono[i] = tono
        }
      }
    }
  }

  /** Traza una línea fina de sellos entre dos puntos */
  private trazo(a: Punto, b: Punto, grosor: number, fuerza: number, tono: number) {
    const pasos = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3))
    for (let s = 0; s <= pasos; s++) {
      const k = s / pasos
      this.sellar(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, grosor, fuerza, tono)
    }
  }

  private rasterizar() {
    this.densidad.fill(0)
    this.tono.fill(0)
    const puntos = this.cuerpo()
    const t = this.reloj / 1000

    // Cuerpo: grueso tras la cabeza y afinándose hacia la cola
    for (let i = NODOS - 1; i >= 0; i--) {
      const k = i / (NODOS - 1)
      const radio = 5 + 12 * Math.sin(Math.min(1, k * 1.6 + 0.25) * Math.PI) * (1 - k * 0.55)
      // Escamas: bandas alternas de densidad
      const escama = 0.8 + 0.2 * Math.sin(i * 1.7)
      this.sellar(puntos[i].x, puntos[i].y, radio, escama, 0)
    }

    // Aletas dorsales en forma de sierra
    for (let i = 3; i < NODOS - 6; i += 2) {
      const p = puntos[i]
      const k = i / NODOS
      const alto = (11 - k * 8) * (0.8 + 0.2 * Math.sin(t * 4 + i))
      const base = 9 * (1 - k * 0.5)
      this.trazo({ x: p.x + p.nx * base, y: p.y + p.ny * base }, { x: p.x + p.nx * (base + alto), y: p.y + p.ny * (base + alto) }, 2, 0.9, 1)
    }

    // Cuatro patas con garras que dan zancadas
    for (const [i, fase] of [
      [9, 0],
      [31, Math.PI],
    ] as const) {
      const p = puntos[i]
      const atras = puntos[i + 3]
      const dirX = p.x - atras.x
      const dirY = p.y - atras.y
      const largo = Math.hypot(dirX, dirY) || 1
      for (const lado of [1, -1]) {
        const zancada = Math.sin(t * 6 + fase + (lado > 0 ? 0 : Math.PI)) * 6
        const rodilla = {
          x: p.x - p.nx * lado * 14 + (dirX / largo) * zancada,
          y: p.y - p.ny * lado * 14 + (dirY / largo) * zancada,
        }
        const pie = {
          x: rodilla.x - p.nx * lado * 9 + (dirX / largo) * (zancada + 4),
          y: rodilla.y - p.ny * lado * 9 + (dirY / largo) * (zancada + 4),
        }
        this.trazo(p, rodilla, 3, 0.85, 0)
        this.trazo(rodilla, pie, 2.5, 0.8, 0)
        for (const garra of [-0.6, 0, 0.6]) {
          const ang = Math.atan2(dirY, dirX) + garra
          this.trazo(pie, { x: pie.x + Math.cos(ang) * 5, y: pie.y + Math.sin(ang) * 5 }, 1.6, 1, 1)
        }
      }
    }

    // Cabeza: hocico, cuernos, bigotes y el ojo
    const cabeza = puntos[0]
    const cuello = puntos[2]
    const ang = Math.atan2(cabeza.y - cuello.y, cabeza.x - cuello.x)
    const fx = Math.cos(ang)
    const fy = Math.sin(ang)
    const hocico = { x: cabeza.x + fx * 13, y: cabeza.y + fy * 13 }
    this.sellar(cabeza.x, cabeza.y, 15, 1, 0)
    this.sellar(hocico.x, hocico.y, 9, 0.95, 0)
    for (const lado of [1, -1]) {
      const raiz = { x: cabeza.x - fx * 4 + cabeza.nx * lado * 8, y: cabeza.y - fy * 4 + cabeza.ny * lado * 8 }
      const punta = { x: raiz.x - fx * 20 + cabeza.nx * lado * 12, y: raiz.y - fy * 20 + cabeza.ny * lado * 12 }
      this.trazo(raiz, punta, 2, 1, 1)
      // Bigotes largos que ondean hacia atrás
      let anterior = { x: hocico.x + fx * 6, y: hocico.y + fy * 6 }
      for (let s = 1; s <= 14; s++) {
        const onda = Math.sin(t * 5 - s * 0.6) * s * 0.6
        const siguiente = {
          x: hocico.x + fx * (6 - s * 4) + cabeza.nx * lado * (6 + s * 2.2 + onda),
          y: hocico.y + fy * (6 - s * 4) + cabeza.ny * lado * (6 + s * 2.2 + onda),
        }
        this.trazo(anterior, siguiente, 1.4, 0.75, 2)
        anterior = siguiente
      }
    }
    // El ojo mira hacia donde va
    this.sellar(cabeza.x + fx * 3 + cabeza.nx * 6, cabeza.y + fy * 3 + cabeza.ny * 6, 3, 1, 3)
  }

  private dibujar() {
    const { ctx, columnas, filas, celdaAlto } = this
    const { ancho, alto } = this.medidas()
    const dpr = this.canvas.width / (ancho || 1)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ancho, alto)
    ctx.font = `${celdaAlto}px ${FUENTE}`
    ctx.textBaseline = 'top'
    for (let f = 0; f < filas; f++) {
      const lineas = ['', '', '', '']
      let hay = false
      for (let c = 0; c < columnas; c++) {
        const i = f * columnas + c
        const d = this.densidad[i]
        const caracter = d > 0.04 ? RAMPA[Math.min(RAMPA.length - 1, 1 + Math.floor(d * (RAMPA.length - 1)))] : ' '
        const tono = this.tono[i]
        if (caracter !== ' ') hay = true
        for (let k = 0; k < 4; k++) lineas[k] += k === tono ? (tono === 3 ? '@' : caracter) : ' '
      }
      if (!hay) continue
      for (let k = 0; k < 4; k++) {
        if (!lineas[k].trim()) continue
        ctx.fillStyle = COLORES[k]
        ctx.fillText(lineas[k], 0, f * celdaAlto)
      }
    }
  }
}
