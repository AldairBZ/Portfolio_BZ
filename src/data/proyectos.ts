import type { NombreEscena } from '../lib/escenas'
import type { Texto } from '../lib/idioma'

export type Ejecucion =
  | { tipo: 'web'; url: string }
  | { tipo: 'java'; jar: string; clase: string }
  | { tipo: 'python'; archivos: string[]; principal: string }
  | { tipo: 'camara' }
  | { tipo: 'cobol' }
  | { tipo: 'codigo' }

export interface Proyecto {
  id: string
  nombre: Texto
  resumen: Texto
  detalle: Texto[]
  stack: string[]
  repo: string
  demo?: string
  ejecucion: Ejecucion
  nota?: Texto
  /** Ilustración generativa que acompaña al proyecto */
  escena: NombreEscena
  /** Captura real del proyecto; si existe, sustituye a la ilustración */
  captura?: Captura
}

export interface Captura {
  src: string
  /** Texto de la pestaña de la ventana */
  pestana: string
  /** Página más alta que la ventana: se recorre despacio de arriba abajo */
  recorrer?: boolean
}

const GITHUB = 'https://github.com/AldairBZ'
const mismo = (texto: string): Texto => ({ es: texto, en: texto })

export const proyectos: Proyecto[] = [
  {
    id: 'lifelevelup',
    nombre: mismo('LifeLevelUp'),
    resumen: {
      es: 'Aplicación web que convierte los hábitos saludables en un juego con logros, comunidad y un asistente con IA.',
      en: 'Web app that turns healthy habits into a game with achievements, a community and an AI assistant.',
    },
    detalle: [
      {
        es: 'API REST en Express con JWT, validación, Helmet y límite de peticiones.',
        en: 'Express REST API with JWT, validation, Helmet and rate limiting.',
      },
      {
        es: 'Login social con Google, GitHub y Facebook mediante OAuth 2.0 escrito a mano, con estado firmado.',
        en: 'Social login with Google, GitHub and Facebook through a hand-written OAuth 2.0 flow with a signed state.',
      },
      {
        es: 'Tests de integración con node:test y Supertest, CI en GitHub Actions.',
        en: 'Integration tests with node:test and Supertest, CI on GitHub Actions.',
      },
      {
        es: 'Frontend en Cloudflare, API en Render y datos en MongoDB Atlas.',
        en: 'Frontend on Cloudflare, API on Render and data on MongoDB Atlas.',
      },
    ],
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'OAuth 2.0'],
    repo: `${GITHUB}/LifeLevelUp`,
    demo: 'https://lifelevelup.08-pruebas.workers.dev',
    ejecucion: { tipo: 'web', url: 'https://lifelevelup.08-pruebas.workers.dev' },
    nota: {
      es: 'La API usa el plan gratuito de Render: la primera petición puede tardar unos segundos.',
      en: 'The API runs on Render’s free plan: the first request can take a few seconds.',
    },
    escena: 'planeta',
    captura: { src: '/proyectos/lifelevelup.webp', pestana: 'lifelevelup.08-pruebas.workers.dev', recorrer: true },
  },
  {
    id: 'tetris',
    nombre: mismo('TetrisGame'),
    resumen: {
      es: 'Juego de bloques de escritorio en Java con Swing, ranking en MySQL, tests JUnit e integración continua.',
      en: 'Desktop block game in Java with Swing, a MySQL leaderboard, JUnit tests and continuous integration.',
    },
    detalle: [
      {
        es: 'Lógica del tablero separada de la interfaz y cubierta con tests JUnit.',
        en: 'Board logic separated from the UI and covered by JUnit tests.',
      },
      { es: 'Ranking persistente con JDBC y patrón DAO.', en: 'Persistent leaderboard with JDBC and the DAO pattern.' },
      { es: 'Build con Maven y CI en GitHub Actions.', en: 'Maven build and CI on GitHub Actions.' },
      {
        es: 'Aquí se ejecuta el mismo .jar de Java dentro del navegador.',
        en: 'The very same Java .jar runs here, inside the browser.',
      },
    ],
    stack: ['Java', 'Swing', 'Maven', 'JUnit', 'MySQL', 'JDBC'],
    repo: `${GITHUB}/TetrisGame`,
    ejecucion: { tipo: 'java', jar: '/apps/tetris.jar', clase: 'com.tetrisgame.Main' },
    nota: {
      es: 'En el navegador no hay base de datos, así que el ranking queda desactivado.',
      en: 'There is no database in the browser, so the leaderboard is disabled.',
    },
    escena: 'bloques',
    captura: { src: '/proyectos/tetris.webp', pestana: 'tetris.jar' },
  },
  {
    id: 'bongust',
    nombre: mismo('Gestor Bon Gust'),
    resumen: {
      es: 'Gestión de inventario para una panadería: productos y movimientos de stock con Python y SQLite.',
      en: 'Inventory manager for a bakery: products and stock movements with Python and SQLite.',
    },
    detalle: [
      {
        es: 'CRUD completo de productos y movimientos de entrada y salida.',
        en: 'Full CRUD for products and incoming and outgoing stock movements.',
      },
      { es: 'Capa de datos separada del menú y modelos con clases.', en: 'Data layer separated from the menu, with model classes.' },
      {
        es: 'Aquí se ejecuta el mismo código Python, con SQLite, en una terminal dentro del navegador.',
        en: 'The same Python code runs here, with SQLite, in a terminal inside the browser.',
      },
    ],
    stack: ['Python', 'SQLite'],
    repo: `${GITHUB}/GestorBonGustProject`,
    ejecucion: { tipo: 'python', archivos: ['main.py', 'database.py', 'models.py'], principal: 'main.py' },
    nota: {
      es: 'El programa original está en español: escribe el número de la opción y pulsa Enter.',
      en: 'The original program is in Spanish: type the option number and press Enter.',
    },
    escena: 'inventario',
  },
  {
    id: 'movimiento',
    nombre: { es: 'Detección de movimiento', en: 'Motion detection' },
    resumen: {
      es: 'Aplicación de escritorio en C# que detecta movimiento con la webcam usando OpenCV.',
      en: 'C# desktop app that detects motion through the webcam using OpenCV.',
    },
    detalle: [
      {
        es: 'Diferencia entre fotogramas, escala de grises, umbral y recuento de píxeles.',
        en: 'Frame differencing, grayscale, thresholding and pixel counting.',
      },
      {
        es: 'Gestión de memoria nativa de OpenCV fotograma a fotograma.',
        en: 'Native OpenCV memory released frame by frame.',
      },
      {
        es: 'Aquí funciona una versión web del mismo algoritmo con la cámara de tu dispositivo.',
        en: 'A web version of the same algorithm runs here with your device’s camera.',
      },
    ],
    stack: ['C#', '.NET', 'OpenCV', 'Windows Forms'],
    repo: `${GITHUB}/DeteccionMovimiento`,
    ejecucion: { tipo: 'camara' },
    nota: {
      es: 'Versión web del algoritmo original en C#. La imagen no sale de tu dispositivo.',
      en: 'Web version of the original C# algorithm. The image never leaves your device.',
    },
    escena: 'pixeles',
  },
  {
    id: 'blackjack',
    nombre: { es: 'BlackJack en COBOL', en: 'BlackJack in COBOL' },
    resumen: {
      es: 'El motor del juego en COBOL y la interfaz en Python, comunicados mediante archivos.',
      en: 'Game engine in COBOL and interface in Python, talking to each other through files.',
    },
    detalle: [
      { es: 'Motor de reglas, mazo y apuestas escrito en COBOL.', en: 'Rules, shoe and betting engine written in COBOL.' },
      { es: 'Interfaz gráfica en Python con Tkinter.', en: 'Graphical interface in Python with Tkinter.' },
      {
        es: 'Comunicación entre procesos mediante archivos de intercambio.',
        en: 'Inter-process communication through exchange files.',
      },
      {
        es: 'Aquí se ejecuta el mismo blackjack.cob.cbl con un intérprete de COBOL que he escrito en TypeScript.',
        en: 'The same blackjack.cob.cbl runs here on a COBOL interpreter I wrote in TypeScript.',
      },
    ],
    stack: ['COBOL', 'Python', 'Tkinter'],
    repo: `${GITHUB}/BlackJack-Proyecto-COBOL`,
    ejecucion: { tipo: 'cobol' },
    nota: {
      es: 'Debajo de la mesa ves el registro BRIDGE.DAT que se intercambian la interfaz y el motor, y los párrafos COBOL que se ejecutan en cada jugada.',
      en: 'Below the table you can see the BRIDGE.DAT record shared by the interface and the engine, and the COBOL paragraphs run on every move.',
    },
    escena: 'tarjeta',
    captura: { src: '/proyectos/blackjack.webp', pestana: 'blackjack.cob.cbl' },
  },
  {
    id: 'residentevil',
    nombre: mismo('Resident Evil Fan Web'),
    resumen: {
      es: 'Web de cuatro páginas, responsive y con animaciones, hecha con HTML5 y CSS3.',
      en: 'Four-page responsive website with animations, built with HTML5 and CSS3.',
    },
    detalle: [
      { es: 'Maquetación responsive sin frameworks.', en: 'Responsive layout without frameworks.' },
      { es: 'Animaciones y vídeo de fondo con CSS.', en: 'CSS animations and background video.' },
    ],
    stack: ['HTML5', 'CSS3'],
    repo: `${GITHUB}/A2_ResidentEvil_Web`,
    demo: 'https://aldairbz.github.io/A2_ResidentEvil_Web/',
    ejecucion: { tipo: 'web', url: 'https://aldairbz.github.io/A2_ResidentEvil_Web/' },
    escena: 'maqueta',
    captura: { src: '/proyectos/residentevil.webp', pestana: 'aldairbz.github.io/A2_ResidentEvil_Web', recorrer: true },
  },
]
