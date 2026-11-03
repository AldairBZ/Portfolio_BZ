import type { NombreEscena } from '../lib/escenas'

export type Ejecucion =
  | { tipo: 'web'; url: string }
  | { tipo: 'java'; jar: string; clase: string }
  | { tipo: 'python'; archivos: string[]; principal: string }
  | { tipo: 'camara' }
  | { tipo: 'codigo' }

export interface Proyecto {
  id: string
  nombre: string
  resumen: string
  detalle: string[]
  stack: string[]
  repo: string
  demo?: string
  ejecucion: Ejecucion
  nota?: string
  /** Ilustración generativa que acompaña al proyecto */
  escena: NombreEscena
}

const GITHUB = 'https://github.com/AldairBZ'

export const proyectos: Proyecto[] = [
  {
    id: 'lifelevelup',
    nombre: 'LifeLevelUp',
    resumen: 'Aplicación web que convierte los hábitos saludables en un juego con logros, comunidad y un asistente con IA.',
    detalle: [
      'API REST en Express con JWT, validación, Helmet y límite de peticiones.',
      'Login social con Google, GitHub y Facebook mediante OAuth 2.0 escrito a mano, con estado firmado.',
      'Tests de integración con node:test y Supertest, CI en GitHub Actions.',
      'Frontend en Cloudflare, API en Render y datos en MongoDB Atlas.',
    ],
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'OAuth 2.0'],
    repo: `${GITHUB}/LifeLevelUp`,
    demo: 'https://lifelevelup.08-pruebas.workers.dev',
    ejecucion: { tipo: 'web', url: 'https://lifelevelup.08-pruebas.workers.dev' },
    nota: 'La API usa el plan gratuito de Render: la primera petición puede tardar unos segundos.',
    escena: 'planeta',
  },
  {
    id: 'tetris',
    nombre: 'TetrisGame',
    resumen: 'Juego de bloques de escritorio en Java con Swing, ranking en MySQL, tests JUnit e integración continua.',
    detalle: [
      'Lógica del tablero separada de la interfaz y cubierta con tests JUnit.',
      'Ranking persistente con JDBC y patrón DAO.',
      'Build con Maven y CI en GitHub Actions.',
      'Aquí se ejecuta el mismo .jar de Java dentro del navegador.',
    ],
    stack: ['Java', 'Swing', 'Maven', 'JUnit', 'MySQL', 'JDBC'],
    repo: `${GITHUB}/TetrisGame`,
    ejecucion: { tipo: 'java', jar: '/apps/tetris.jar', clase: 'com.tetrisgame.Main' },
    nota: 'En el navegador no hay base de datos, así que el ranking queda desactivado.',
    escena: 'bloques',
  },
  {
    id: 'bongust',
    nombre: 'Gestor Bon Gust',
    resumen: 'Gestión de inventario para una panadería: productos y movimientos de stock con Python y SQLite.',
    detalle: [
      'CRUD completo de productos y movimientos de entrada y salida.',
      'Capa de datos separada del menú y modelos con clases.',
      'Aquí se ejecuta el mismo código Python, con SQLite, en una terminal dentro del navegador.',
    ],
    stack: ['Python', 'SQLite'],
    repo: `${GITHUB}/GestorBonGustProject`,
    ejecucion: { tipo: 'python', archivos: ['main.py', 'database.py', 'models.py'], principal: 'main.py' },
    escena: 'inventario',
  },
  {
    id: 'movimiento',
    nombre: 'Detección de movimiento',
    resumen: 'Aplicación de escritorio en C# que detecta movimiento con la webcam usando OpenCV.',
    detalle: [
      'Diferencia entre fotogramas, escala de grises, umbral y recuento de píxeles.',
      'Gestión de memoria nativa de OpenCV fotograma a fotograma.',
      'Aquí funciona una versión web del mismo algoritmo con la cámara de tu dispositivo.',
    ],
    stack: ['C#', '.NET', 'OpenCV', 'Windows Forms'],
    repo: `${GITHUB}/DeteccionMovimiento`,
    ejecucion: { tipo: 'camara' },
    nota: 'Versión web del algoritmo original en C#. La imagen no sale de tu dispositivo.',
    escena: 'pixeles',
  },
  {
    id: 'blackjack',
    nombre: 'BlackJack en COBOL',
    resumen: 'El motor del juego en COBOL y la interfaz en Python, comunicados mediante archivos.',
    detalle: [
      'Motor de reglas, mazo y apuestas escrito en COBOL.',
      'Interfaz gráfica en Python con Tkinter.',
      'Comunicación entre procesos mediante archivos de intercambio.',
    ],
    stack: ['COBOL', 'Python', 'Tkinter'],
    repo: `${GITHUB}/BlackJack-Proyecto-COBOL`,
    ejecucion: { tipo: 'codigo' },
    escena: 'tarjeta',
  },
  {
    id: 'residentevil',
    nombre: 'Resident Evil Fan Web',
    resumen: 'Web de cuatro páginas, responsive y con animaciones, hecha con HTML5 y CSS3.',
    detalle: ['Maquetación responsive sin frameworks.', 'Animaciones y vídeo de fondo con CSS.'],
    stack: ['HTML5', 'CSS3'],
    repo: `${GITHUB}/A2_ResidentEvil_Web`,
    demo: 'https://aldairbz.github.io/A2_ResidentEvil_Web/',
    ejecucion: { tipo: 'web', url: 'https://aldairbz.github.io/A2_ResidentEvil_Web/' },
    escena: 'maqueta',
  },
]
