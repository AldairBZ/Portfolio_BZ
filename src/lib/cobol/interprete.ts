/*
 * Intérprete de COBOL (formato fijo) para el subconjunto que usa el motor de
 * BlackJack: WORKING-STORAGE con PIC X / 9, OCCURS y grupos; archivos LINE
 * SEQUENTIAL; MOVE, COMPUTE, ADD, SUBTRACT, IF, EVALUATE, PERFORM (párrafo,
 * TIMES, UNTIL y VARYING), STRING ... WITH POINTER, READ / WRITE, EXIT y
 * FUNCTION RANDOM. La memoria se guarda como caracteres, igual que en COBOL.
 */

/* ---------- Léxico ---------- */

interface Token {
  t: 'pal' | 'num' | 'cad' | 'sim' | 'punto'
  v: string
  /** Columna dentro del área de código (0 = área A) */
  col: number
  linea: number
}

function tokenizar(fuente: string): Token[] {
  const tokens: Token[] = []
  fuente.replace(/\r/g, '').split('\n').forEach((bruta, n) => {
    if (bruta.length < 7 || bruta[6] === '*' || bruta[6] === '/') return
    // Sin límite en la columna 72: el original se compiló con líneas más largas
    const codigo = bruta.slice(7)
    let i = 0
    while (i < codigo.length) {
      const c = codigo[i]
      if (c === ' ' || c === ',' || c === ';') {
        i++
        continue
      }
      const col = i
      if (c === '"' || c === "'") {
        const fin = codigo.indexOf(c, i + 1)
        tokens.push({ t: 'cad', v: codigo.slice(i + 1, fin), col, linea: n + 1 })
        i = fin + 1
      } else if (c === '.' && (i + 1 >= codigo.length || codigo[i + 1] === ' ')) {
        tokens.push({ t: 'punto', v: '.', col, linea: n + 1 })
        i++
      } else if (/[0-9]/.test(c)) {
        let j = i
        while (j < codigo.length && /[0-9]/.test(codigo[j])) j++
        // Un número seguido de letras o guiones es un nombre (p. ej. 01-ALGO)
        if (j < codigo.length && /[A-Za-z-]/.test(codigo[j])) {
          while (j < codigo.length && /[A-Za-z0-9-]/.test(codigo[j])) j++
          tokens.push({ t: 'pal', v: codigo.slice(i, j).toUpperCase(), col, linea: n + 1 })
        } else {
          tokens.push({ t: 'num', v: codigo.slice(i, j), col, linea: n + 1 })
        }
        i = j
      } else if (/[A-Za-z]/.test(c)) {
        let j = i
        while (j < codigo.length && /[A-Za-z0-9-]/.test(codigo[j])) j++
        // Un nombre no termina en guion
        while (codigo[j - 1] === '-') j--
        tokens.push({ t: 'pal', v: codigo.slice(i, j).toUpperCase(), col, linea: n + 1 })
        i = j
      } else if ((c === '>' || c === '<') && codigo[i + 1] === '=') {
        tokens.push({ t: 'sim', v: c + '=', col, linea: n + 1 })
        i += 2
      } else {
        tokens.push({ t: 'sim', v: c, col, linea: n + 1 })
        i++
      }
    }
  })
  return tokens
}

/* ---------- Datos ---------- */

interface Campo {
  nombre: string
  nivel: number
  inicio: number
  largo: number
  numerico: boolean
  digitos: number
  ocurre: number
  hijos: Campo[]
  valor?: string
}

interface Archivo {
  nombre: string
  ruta: string
  opcional: boolean
  registro?: Campo
  lineas: string[]
  lectura: number
  abierto: '' | 'INPUT' | 'OUTPUT'
}

function largoPic(pic: string) {
  let largo = 0
  const re = /([X9A])(?:\((\d+)\))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(pic))) largo += m[2] ? Number(m[2]) : 1
  return largo
}

/* ---------- Árbol de sentencias ---------- */

type Expr =
  | { k: 'num'; v: number }
  | { k: 'cad'; v: string }
  | { k: 'fig'; v: 'SPACE' | 'ZERO' }
  | { k: 'ref'; campo: Campo; indice?: Expr; desde?: Expr; largo?: Expr }
  | { k: 'op'; op: string; a: Expr; b: Expr }
  | { k: 'neg'; a: Expr }
  | { k: 'fun'; nombre: string; args: Expr[] }

type Cond =
  | { k: 'rel'; op: string; a: Expr; b: Expr }
  | { k: 'and' | 'or'; a: Cond; b: Cond }
  | { k: 'not'; a: Cond }

type Sent =
  | { k: 'move'; desde: Expr; a: Expr[] }
  | { k: 'compute'; a: Expr; e: Expr }
  | { k: 'add' | 'subtract'; e: Expr; a: Expr }
  | { k: 'if'; c: Cond; si: Sent[]; no: Sent[] }
  | { k: 'evaluate'; sujeto: Expr; casos: { valor: Expr | null; cuerpo: Sent[] }[] }
  | { k: 'perform'; parrafo: string; veces?: Expr; hasta?: Cond }
  | { k: 'until'; hasta: Cond; cuerpo: Sent[] }
  | { k: 'varying'; v: Expr; desde: Expr; paso: Expr; hasta: Cond; cuerpo: Sent[] }
  | { k: 'string'; partes: Expr[]; a: Expr; puntero?: Expr }
  | { k: 'accept'; a: Expr; de: string }
  | { k: 'open'; modo: 'INPUT' | 'OUTPUT'; archivos: string[] }
  | { k: 'close'; archivos: string[] }
  | { k: 'read'; archivo: string; en?: Expr; alFinal: Sent[] }
  | { k: 'write'; registro: Expr; desde?: Expr }
  | { k: 'exit'; que: 'PARAGRAPH' | 'PERFORM' }
  | { k: 'stop' }
  | { k: 'continue' }


export interface Traza {
  parrafos: string[]
  sentencias: number
}

export class ProgramaCobol {
  readonly id: string
  private tokens: Token[]
  private p = 0
  private memoria: string[] = []
  private campos = new Map<string, Campo>()
  private archivos = new Map<string, Archivo>()
  private parrafos = new Map<string, Sent[]>()
  private orden: string[] = []
  private semilla = 1
  private traza: Traza = { parrafos: [], sentencias: 0 }
  /** Sistema de archivos virtual compartido entre ejecuciones */
  readonly disco = new Map<string, string>()

  constructor(fuente: string) {
    this.tokens = tokenizar(fuente)
    this.id = this.leerCabecera()
    this.leerArchivos()
    this.leerDatos()
    this.leerProcedimientos()
  }

  /* ---------- Análisis ---------- */

  private get tok() {
    return this.tokens[this.p]
  }
  /** Se consulta con un método para que TypeScript no fije el tipo del token tras avanzar */
  private esPunto() {
    return this.tok?.t === 'punto'
  }
  private es(...v: string[]) {
    return this.tok !== undefined && v.includes(this.tok.v)
  }
  private esperar(v: string) {
    if (!this.es(v)) throw new Error(`Se esperaba ${v} en la línea ${this.tok?.linea}, hay ${this.tok?.v}`)
    this.p++
  }
  private saltarHasta(v: string) {
    while (this.tok && this.tok.v !== v) this.p++
  }

  private leerCabecera() {
    this.saltarHasta('PROGRAM-ID')
    this.p++
    // PROGRAM-ID. NOMBRE. : el punto tras PROGRAM-ID es opcional
    if (this.esPunto()) this.p++
    return this.tokens[this.p++].v
  }

  private leerArchivos() {
    const inicio = this.p
    while (this.tok && !this.es('DATA')) {
      if (this.es('SELECT')) {
        this.p++
        let opcional = false
        if (this.es('OPTIONAL')) {
          opcional = true
          this.p++
        }
        const nombre = this.tok.v
        this.saltarHasta('ASSIGN')
        this.p++
        if (this.es('TO')) this.p++
        const ruta = this.tok.v
        this.archivos.set(nombre, { nombre, ruta, opcional, lineas: [], lectura: 0, abierto: '' })
      }
      this.p++
    }
    if (!this.tok) this.p = inicio
  }

  private leerDatos() {
    this.saltarHasta('DATA')
    let archivoActual: Archivo | null = null
    const pila: Campo[] = []

    const cerrarGrupos = (hasta: number) => {
      while (pila.length && pila[pila.length - 1].nivel >= hasta) {
        const c = pila.pop()!
        if (c.hijos.length) c.largo = c.hijos.reduce((s, h) => s + h.largo * h.ocurre, 0)
      }
    }

    while (this.tok && !this.es('PROCEDURE')) {
      if (this.es('FD')) {
        cerrarGrupos(1)
        this.p++
        archivoActual = this.archivos.get(this.tok.v) ?? null
        this.saltarHasta('.')
        this.p++
        continue
      }
      if (this.es('WORKING-STORAGE')) archivoActual = null
      if (this.tok.t === 'num' && this.tokens[this.p + 1]?.t === 'pal') {
        const nivel = Number(this.tok.v)
        const nombre = this.tokens[this.p + 1].v
        this.p += 2
        let pic = ''
        let ocurre = 1
        let valor: string | undefined
        while (this.tok && !this.esPunto()) {
          if (this.es('PIC', 'PICTURE')) {
            this.p++
            if (this.es('IS')) this.p++
            // La máscara puede venir partida en varios tokens: X(10), 9(6), 99
            while (this.tok && !this.esPunto() && !this.es('VALUE', 'OCCURS')) {
              pic += this.tok.v
              this.p++
            }
            continue
          }
          if (this.es('OCCURS')) {
            this.p++
            ocurre = Number(this.tok.v)
            this.p++
            if (this.es('TIMES')) this.p++
            continue
          }
          if (this.es('VALUE')) {
            this.p++
            valor = this.es('SPACES', 'SPACE') ? ' ' : this.es('ZERO', 'ZEROS', 'ZEROES') ? '0' : this.tok.v
            this.p++
            continue
          }
          this.p++
        }
        this.p++

        cerrarGrupos(nivel)
        const padre = pila[pila.length - 1]
        const largo = pic ? largoPic(pic) : 0
        // La posición en memoria se calcula al final, cuando se conocen todos los tamaños
        const campo: Campo = {
          nombre,
          nivel,
          inicio: 0,
          largo,
          numerico: /^9/.test(pic),
          digitos: largo,
          ocurre,
          hijos: [],
          valor,
        }
        if (padre) padre.hijos.push(campo)
        if (nombre !== 'FILLER') this.campos.set(nombre, campo)
        if (nivel === 1 && archivoActual) archivoActual.registro = campo
        pila.push(campo)
        continue
      }
      this.p++
    }
    cerrarGrupos(1)

    // Reserva la memoria de todos los registros e inicializa: espacios en X, ceros en 9
    const raices = [...this.campos.values()].filter((c) => c.nivel === 1)
    let siguiente = 0
    const recolocar = (c: Campo, base: number) => {
      c.inicio = base
      let cursor = base
      for (const h of c.hijos) {
        recolocar(h, cursor)
        cursor += h.largo * h.ocurre
      }
    }
    for (const r of raices) {
      recolocar(r, siguiente)
      siguiente += r.largo * r.ocurre
    }
    this.memoria = Array(siguiente).fill(' ')
    const iniciar = (c: Campo) => {
      if (c.hijos.length) return c.hijos.forEach(iniciar)
      for (let i = 0; i < c.ocurre; i++) {
        const base = c.inicio + i * c.largo
        const texto = c.valor !== undefined ? this.formatear(c, c.valor) : (c.numerico ? '0' : ' ').repeat(c.largo)
        for (let j = 0; j < c.largo; j++) this.memoria[base + j] = texto[j]
      }
    }
    raices.forEach(iniciar)
  }

  private leerProcedimientos() {
    this.saltarHasta('PROCEDURE')
    this.saltarHasta('.')
    this.p++
    while (this.tok) {
      // Un párrafo empieza en el área A: nombre seguido de punto
      if (this.tok.t === 'pal' && this.tok.col < 4 && this.tokens[this.p + 1]?.t === 'punto') {
        const nombre = this.tok.v
        this.p += 2
        const cuerpo: Sent[] = []
        while (this.tok && !(this.tok.t === 'pal' && this.tok.col < 4 && this.tokens[this.p + 1]?.t === 'punto')) {
          if (this.esPunto()) {
            this.p++
            continue
          }
          cuerpo.push(...this.bloque([]))
        }
        this.parrafos.set(nombre, cuerpo)
        this.orden.push(nombre)
      } else {
        this.p++
      }
    }
  }

  /** Lee sentencias hasta un punto o hasta una de las palabras de parada */
  private bloque(paradas: string[]): Sent[] {
    const lista: Sent[] = []
    while (this.tok && !this.esPunto() && !this.es(...paradas)) {
      lista.push(this.sentencia())
    }
    return lista
  }

  private sentencia(): Sent {
    const verbo = this.tok.v
    this.p++
    switch (verbo) {
      case 'MOVE': {
        const desde = this.operando()
        this.esperar('TO')
        const a: Expr[] = []
        while (this.tok && this.tok.t === 'pal' && this.campos.has(this.tok.v)) a.push(this.operando())
        return { k: 'move', desde, a }
      }
      case 'COMPUTE': {
        const a = this.operando()
        this.esperar('=')
        return { k: 'compute', a, e: this.expresion() }
      }
      case 'ADD': {
        const e = this.expresion()
        this.esperar('TO')
        return { k: 'add', e, a: this.operando() }
      }
      case 'SUBTRACT': {
        const e = this.expresion()
        this.esperar('FROM')
        return { k: 'subtract', e, a: this.operando() }
      }
      case 'IF': {
        const c = this.condicion()
        if (this.es('THEN')) this.p++
        const si = this.bloque(['ELSE', 'END-IF'])
        let no: Sent[] = []
        if (this.es('ELSE')) {
          this.p++
          no = this.bloque(['END-IF'])
        }
        if (this.es('END-IF')) this.p++
        return { k: 'if', c, si, no }
      }
      case 'EVALUATE': {
        const sujeto = this.expresion()
        const casos: { valor: Expr | null; cuerpo: Sent[] }[] = []
        while (this.es('WHEN')) {
          this.p++
          let valor: Expr | null = null
          if (this.es('OTHER')) this.p++
          else valor = this.operando()
          casos.push({ valor, cuerpo: this.bloque(['WHEN', 'END-EVALUATE']) })
        }
        if (this.es('END-EVALUATE')) this.p++
        return { k: 'evaluate', sujeto, casos }
      }
      case 'PERFORM': {
        if (this.es('UNTIL')) {
          this.p++
          const hasta = this.condicion()
          const cuerpo = this.bloque(['END-PERFORM'])
          this.esperar('END-PERFORM')
          return { k: 'until', hasta, cuerpo }
        }
        if (this.es('VARYING')) {
          this.p++
          const v = this.operando()
          this.esperar('FROM')
          const desde = this.expresion()
          this.esperar('BY')
          const paso = this.expresion()
          this.esperar('UNTIL')
          const hasta = this.condicion()
          const cuerpo = this.bloque(['END-PERFORM'])
          this.esperar('END-PERFORM')
          return { k: 'varying', v, desde, paso, hasta, cuerpo }
        }
        const parrafo = this.tok.v
        this.p++
        if (this.tok && (this.tok.t === 'num' || (this.tok.t === 'pal' && this.campos.has(this.tok.v))) && this.tokens[this.p + 1]?.v === 'TIMES') {
          const veces = this.operando()
          this.p++
          return { k: 'perform', parrafo, veces }
        }
        if (this.es('UNTIL')) {
          this.p++
          return { k: 'perform', parrafo, hasta: this.condicion() }
        }
        return { k: 'perform', parrafo }
      }
      case 'STRING': {
        const partes: Expr[] = []
        while (!this.es('INTO')) {
          if (this.es('DELIMITED')) {
            this.p += 2
            if (this.es('SIZE')) this.p++
            continue
          }
          partes.push(this.operando())
        }
        this.p++
        const a = this.operando()
        let puntero: Expr | undefined
        if (this.es('WITH')) this.p++
        if (this.es('POINTER')) {
          this.p++
          puntero = this.operando()
        }
        if (this.es('END-STRING')) this.p++
        return { k: 'string', partes, a, puntero }
      }
      case 'ACCEPT': {
        const a = this.operando()
        this.esperar('FROM')
        const de = this.tok.v
        this.p++
        return { k: 'accept', a, de }
      }
      case 'OPEN': {
        const modo = this.tok.v as 'INPUT' | 'OUTPUT'
        this.p++
        const archivos: string[] = []
        while (this.tok && this.archivos.has(this.tok.v)) archivos.push(this.tokens[this.p++].v)
        return { k: 'open', modo, archivos }
      }
      case 'CLOSE': {
        const archivos: string[] = []
        while (this.tok && this.archivos.has(this.tok.v)) archivos.push(this.tokens[this.p++].v)
        return { k: 'close', archivos }
      }
      case 'READ': {
        const archivo = this.tok.v
        this.p++
        if (this.es('RECORD')) this.p++
        let en: Expr | undefined
        if (this.es('INTO')) {
          this.p++
          en = this.operando()
        }
        let alFinal: Sent[] = []
        if (this.es('AT')) this.p++
        if (this.es('END')) {
          this.p++
          alFinal = this.bloque(['END-READ'])
        }
        if (this.es('END-READ')) this.p++
        return { k: 'read', archivo, en, alFinal }
      }
      case 'WRITE': {
        const registro = this.operando()
        let desde: Expr | undefined
        if (this.es('FROM')) {
          this.p++
          desde = this.operando()
        }
        return { k: 'write', registro, desde }
      }
      case 'EXIT': {
        const que = this.es('PERFORM') ? 'PERFORM' : 'PARAGRAPH'
        if (this.es('PERFORM', 'PARAGRAPH')) this.p++
        return { k: 'exit', que }
      }
      case 'STOP':
        if (this.es('RUN')) this.p++
        return { k: 'stop' }
      case 'CONTINUE':
        return { k: 'continue' }
      default:
        throw new Error(`Instrucción no soportada: ${verbo} (línea ${this.tokens[this.p - 1].linea})`)
    }
  }

  private operando(): Expr {
    const t = this.tok
    if (t.t === 'cad') {
      this.p++
      return { k: 'cad', v: t.v }
    }
    if (t.t === 'num') {
      this.p++
      return { k: 'num', v: Number(t.v) }
    }
    if (this.es('SPACE', 'SPACES')) {
      this.p++
      return { k: 'fig', v: 'SPACE' }
    }
    if (this.es('ZERO', 'ZEROS', 'ZEROES')) {
      this.p++
      return { k: 'fig', v: 'ZERO' }
    }
    if (this.es('FUNCTION')) {
      this.p++
      const nombre = this.tok.v
      this.p++
      const args: Expr[] = []
      if (this.es('(')) {
        this.p++
        while (!this.es(')')) args.push(this.expresion())
        this.p++
      }
      return { k: 'fun', nombre, args }
    }
    const campo = this.campos.get(t.v)
    if (!campo) throw new Error(`Dato desconocido: ${t.v} (línea ${t.linea})`)
    this.p++
    const ref: Expr = { k: 'ref', campo }
    if (this.es('(')) {
      this.p++
      const primero = this.expresion()
      if (this.es(':')) {
        this.p++
        ref.desde = primero
        ref.largo = this.expresion()
      } else {
        ref.indice = primero
      }
      this.esperar(')')
    }
    return ref
  }

  private expresion(): Expr {
    let a = this.termino()
    while (this.es('+', '-')) {
      const op = this.tokens[this.p++].v
      a = { k: 'op', op, a, b: this.termino() }
    }
    return a
  }

  private termino(): Expr {
    let a = this.factor()
    while (this.es('*', '/')) {
      const op = this.tokens[this.p++].v
      a = { k: 'op', op, a, b: this.factor() }
    }
    return a
  }

  private factor(): Expr {
    if (this.es('(')) {
      this.p++
      const e = this.expresion()
      this.esperar(')')
      return e
    }
    if (this.es('-')) {
      this.p++
      return { k: 'neg', a: this.factor() }
    }
    return this.operando()
  }

  private condicion(): Cond {
    let a = this.condicionY()
    while (this.es('OR')) {
      this.p++
      a = { k: 'or', a, b: this.condicionY() }
    }
    return a
  }

  private condicionY(): Cond {
    let a = this.relacion()
    while (this.es('AND')) {
      this.p++
      a = { k: 'and', a, b: this.relacion() }
    }
    return a
  }

  private relacion(): Cond {
    if (this.es('NOT') && this.tokens[this.p + 1]?.v !== '=') {
      this.p++
      return { k: 'not', a: this.relacion() }
    }
    const a = this.expresion()
    if (this.es('IS')) this.p++
    let negado = false
    if (this.es('NOT')) {
      negado = true
      this.p++
    }
    const op = this.tok.v
    this.p++
    const rel: Cond = { k: 'rel', op, a, b: this.expresion() }
    return negado ? { k: 'not', a: rel } : rel
  }

  /* ---------- Memoria ---------- */

  private zona(ref: Extract<Expr, { k: 'ref' }>) {
    const c = ref.campo
    let inicio = c.inicio
    let largo = c.largo
    if (ref.indice) inicio += (this.numero(ref.indice) - 1) * c.largo
    if (ref.desde) {
      inicio += this.numero(ref.desde) - 1
      largo = ref.largo ? this.numero(ref.largo) : largo - this.numero(ref.desde) + 1
    }
    return { inicio, largo, numerico: c.numerico && !ref.desde && !c.hijos.length }
  }

  private texto(e: Expr, largo = 0): string {
    switch (e.k) {
      case 'cad':
        return e.v
      case 'num':
        return String(e.v)
      case 'fig':
        return (e.v === 'SPACE' ? ' ' : '0').repeat(Math.max(largo, 1))
      case 'ref': {
        const z = this.zona(e)
        return this.memoria.slice(z.inicio, z.inicio + z.largo).join('')
      }
      default:
        return String(Math.trunc(this.numero(e)))
    }
  }

  private numero(e: Expr): number {
    switch (e.k) {
      case 'num':
        return e.v
      case 'fig':
        return 0
      case 'cad':
        return Number(e.v.replace(/\D/g, '') || 0)
      case 'ref': {
        const z = this.zona(e)
        const s = this.memoria.slice(z.inicio, z.inicio + z.largo).join('')
        return Number(s.replace(/[^0-9]/g, (c) => (c === ' ' ? '0' : '')) || 0)
      }
      case 'neg':
        return -this.numero(e.a)
      case 'op': {
        const a = this.numero(e.a)
        const b = this.numero(e.b)
        return e.op === '+' ? a + b : e.op === '-' ? a - b : e.op === '*' ? a * b : a / b
      }
      case 'fun':
        if (e.nombre === 'RANDOM') {
          if (e.args.length) this.semilla = Math.trunc(this.numero(e.args[0])) || 1
          return this.aleatorio()
        }
        throw new Error(`Función no soportada: ${e.nombre}`)
    }
  }

  private esNumerica(e: Expr): boolean {
    if (e.k === 'num' || e.k === 'op' || e.k === 'neg' || e.k === 'fun') return true
    if (e.k === 'ref') return this.zona(e).numerico
    return false
  }

  // Generador congruencial: la misma semilla da la misma secuencia
  private aleatorio() {
    this.semilla = (Math.imul(this.semilla, 1103515245) + 12345) >>> 0
    return (this.semilla >>> 8) / 16777216
  }

  private formatear(c: Pick<Campo, 'numerico' | 'largo'>, valor: string) {
    if (c.numerico) return valor.replace(/\D/g, '').padStart(c.largo, '0').slice(-c.largo)
    return valor.padEnd(c.largo, ' ').slice(0, c.largo)
  }

  private guardar(destino: Expr, origen: Expr) {
    if (destino.k !== 'ref') throw new Error('Destino no válido')
    const z = this.zona(destino)
    let s: string
    if (z.numerico) {
      if (this.esNumerica(origen) || origen.k === 'fig') {
        const n = Math.abs(Math.trunc(this.numero(origen)))
        s = String(n).padStart(z.largo, '0').slice(-z.largo)
      } else {
        // Alfanumérico a numérico: se copia alineado a la derecha
        const t = this.texto(origen)
        s = t.length >= z.largo ? t.slice(-z.largo) : t.padStart(z.largo, '0')
      }
    } else {
      const t = origen.k === 'fig' ? this.texto(origen, z.largo) : this.texto(origen)
      s = t.padEnd(z.largo, ' ').slice(0, z.largo)
    }
    for (let i = 0; i < z.largo; i++) this.memoria[z.inicio + i] = s[i]
  }

  private guardarNumero(destino: Expr, n: number) {
    this.guardar(destino, { k: 'num', v: n })
  }

  private comparar(c: Extract<Cond, { k: 'rel' }>): boolean {
    let r: number
    if (this.esNumerica(c.a) && (this.esNumerica(c.b) || c.b.k === 'fig')) {
      r = this.numero(c.a) - this.numero(c.b)
    } else {
      const largo = Math.max(this.texto(c.a).length, this.texto(c.b).length)
      const a = (c.a.k === 'fig' ? this.texto(c.a, largo) : this.texto(c.a)).padEnd(largo, ' ')
      const b = (c.b.k === 'fig' ? this.texto(c.b, largo) : this.texto(c.b)).padEnd(largo, ' ')
      r = a < b ? -1 : a > b ? 1 : 0
    }
    switch (c.op) {
      case '=':
        return r === 0
      case '<':
        return r < 0
      case '>':
        return r > 0
      case '<=':
        return r <= 0
      case '>=':
        return r >= 0
    }
    throw new Error(`Operador no soportado: ${c.op}`)
  }

  private evaluar(c: Cond): boolean {
    if (c.k === 'rel') return this.comparar(c)
    if (c.k === 'not') return !this.evaluar(c.a)
    if (c.k === 'and') return this.evaluar(c.a) && this.evaluar(c.b)
    return this.evaluar(c.a) || this.evaluar(c.b)
  }

  /* ---------- Ejecución ---------- */

  private ejecutarLista(lista: Sent[]): 'sigue' | 'parrafo' | 'perform' | 'stop' {
    for (const s of lista) {
      const r = this.ejecutar(s)
      if (r !== 'sigue') return r
    }
    return 'sigue'
  }

  private llamar(nombre: string): 'sigue' | 'stop' {
    const cuerpo = this.parrafos.get(nombre)
    if (!cuerpo) throw new Error(`Párrafo inexistente: ${nombre}`)
    this.traza.parrafos.push(nombre)
    const r = this.ejecutarLista(cuerpo)
    return r === 'stop' ? 'stop' : 'sigue'
  }

  private ejecutar(s: Sent): 'sigue' | 'parrafo' | 'perform' | 'stop' {
    if (++this.traza.sentencias > 2_000_000) throw new Error('Demasiadas instrucciones: posible bucle infinito')
    switch (s.k) {
      case 'move':
        for (const a of s.a) this.guardar(a, s.desde)
        return 'sigue'
      case 'compute':
        this.guardarNumero(s.a, this.numero(s.e))
        return 'sigue'
      case 'add':
        this.guardarNumero(s.a, this.numero(s.a) + this.numero(s.e))
        return 'sigue'
      case 'subtract':
        this.guardarNumero(s.a, this.numero(s.a) - this.numero(s.e))
        return 'sigue'
      case 'if':
        return this.ejecutarLista(this.evaluar(s.c) ? s.si : s.no)
      case 'evaluate': {
        for (const caso of s.casos) {
          const coincide =
            caso.valor === null || this.comparar({ k: 'rel', op: '=', a: s.sujeto, b: caso.valor })
          if (coincide) return this.ejecutarLista(caso.cuerpo)
        }
        return 'sigue'
      }
      case 'perform': {
        if (s.veces) {
          const n = this.numero(s.veces)
          for (let i = 0; i < n; i++) if (this.llamar(s.parrafo) === 'stop') return 'stop'
          return 'sigue'
        }
        if (s.hasta) {
          while (!this.evaluar(s.hasta)) if (this.llamar(s.parrafo) === 'stop') return 'stop'
          return 'sigue'
        }
        return this.llamar(s.parrafo)
      }
      case 'until':
        while (!this.evaluar(s.hasta)) {
          const r = this.ejecutarLista(s.cuerpo)
          if (r === 'perform') break
          if (r !== 'sigue') return r
        }
        return 'sigue'
      case 'varying':
        this.guardarNumero(s.v, this.numero(s.desde))
        while (!this.evaluar(s.hasta)) {
          const r = this.ejecutarLista(s.cuerpo)
          if (r === 'perform') break
          if (r !== 'sigue') return r
          this.guardarNumero(s.v, this.numero(s.v) + this.numero(s.paso))
        }
        return 'sigue'
      case 'string': {
        if (s.a.k !== 'ref') throw new Error('STRING necesita un destino')
        const z = this.zona(s.a)
        let pos = s.puntero ? this.numero(s.puntero) : 1
        for (const parte of s.partes) {
          for (const c of this.texto(parte)) {
            if (pos < 1 || pos > z.largo) break
            this.memoria[z.inicio + pos - 1] = c
            pos++
          }
        }
        if (s.puntero) this.guardarNumero(s.puntero, pos)
        return 'sigue'
      }
      case 'accept': {
        const d = new Date()
        const dos = (n: number) => String(n).padStart(2, '0')
        const valor =
          s.de === 'TIME'
            ? `${dos(d.getHours())}${dos(d.getMinutes())}${dos(d.getSeconds())}${dos(Math.floor(d.getMilliseconds() / 10))}`
            : `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}`
        this.guardar(s.a, { k: 'cad', v: valor })
        return 'sigue'
      }
      case 'open':
        for (const nombre of s.archivos) {
          const f = this.archivos.get(nombre)!
          f.abierto = s.modo
          f.lectura = 0
          if (s.modo === 'OUTPUT') f.lineas = []
          else {
            const contenido = this.disco.get(f.ruta)
            if (contenido === undefined && !f.opcional) throw new Error(`No existe ${f.ruta}`)
            f.lineas = contenido ? contenido.split('\n').filter((l, i, arr) => l !== '' || i < arr.length - 1) : []
          }
        }
        return 'sigue'
      case 'close':
        for (const nombre of s.archivos) {
          const f = this.archivos.get(nombre)!
          if (f.abierto === 'OUTPUT') this.disco.set(f.ruta, f.lineas.map((l) => l + '\n').join(''))
          f.abierto = ''
        }
        return 'sigue'
      case 'read': {
        const f = this.archivos.get(s.archivo)!
        if (f.lectura >= f.lineas.length) return this.ejecutarLista(s.alFinal)
        const linea = f.lineas[f.lectura++]
        const reg: Expr = { k: 'ref', campo: f.registro! }
        this.guardar(reg, { k: 'cad', v: linea })
        if (s.en) this.guardar(s.en, reg)
        return 'sigue'
      }
      case 'write': {
        if (s.desde) this.guardar(s.registro, s.desde)
        const f = [...this.archivos.values()].find((a) => s.registro.k === 'ref' && a.registro === s.registro.campo)!
        // LINE SEQUENTIAL guarda la línea sin los espacios finales
        f.lineas.push(this.texto(s.registro).replace(/ +$/, ''))
        return 'sigue'
      }
      case 'exit':
        return s.que === 'PARAGRAPH' ? 'parrafo' : 'perform'
      case 'stop':
        return 'stop'
      case 'continue':
        return 'sigue'
    }
  }

  /** Ejecuta el programa desde el primer párrafo, como al lanzar el .exe */
  ejecutarPrograma(): Traza {
    this.traza = { parrafos: [], sentencias: 0 }
    // Cada ejecución empieza con la memoria inicial, como un proceso nuevo
    this.reiniciarMemoria()
    for (const nombre of this.orden) {
      if (this.llamar(nombre) === 'stop') break
    }
    return this.traza
  }

  private memoriaInicial: string[] | null = null

  private reiniciarMemoria() {
    if (!this.memoriaInicial) this.memoriaInicial = [...this.memoria]
    else this.memoria = [...this.memoriaInicial]
  }

  /** Contenido de un campo tal como está en memoria (para pruebas y depuración) */
  leer(nombre: string) {
    const campo = this.campos.get(nombre)
    if (!campo) throw new Error(`Dato desconocido: ${nombre}`)
    return this.texto({ k: 'ref', campo })
  }

  get estadisticas() {
    return {
      parrafos: this.orden.length,
      campos: this.campos.size,
      archivos: [...this.archivos.values()].map((a) => a.ruta),
    }
  }
}
