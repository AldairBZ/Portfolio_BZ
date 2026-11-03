# Portfolio · Scheneider Baltazar

Mi portfolio como desarrollador Full Stack. Los proyectos no se enseñan con capturas: se ejecutan dentro de la página.

[![CI](https://github.com/AldairBZ/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/AldairBZ/portfolio/actions/workflows/ci.yml) ![React](https://img.shields.io/badge/React-19-149eca) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)

## Qué tiene de especial

- **Proyectos ejecutables en el navegador**
  - **TetrisGame**: el `.jar` original de Java 21 corre con [CheerpJ](https://cheerpj.com) dentro de un iframe de tamaño fijo que se escala a cualquier pantalla, con controles táctiles en el móvil.
  - **Gestor Bon Gust**: el `main.py` original corre con [Pyodide](https://pyodide.org) y SQLite en una terminal propia. Un transformador de AST convierte sus `input()` en esperas asíncronas sin tocar el archivo.
  - **BlackJack en COBOL**: el `blackjack.cob.cbl` original se ejecuta con un **intérprete de COBOL escrito en TypeScript** (`src/lib/cobol`), con el mismo intercambio por `BRIDGE.DAT` que la versión de escritorio.
  - **Detección de movimiento**: el algoritmo de la versión en C# portado a canvas, con la cámara del dispositivo.
  - **LifeLevelUp** y la web de Resident Evil se abren integradas.
- **Gráficos hechos con código**: el planeta de la portada, el retrato y los logos de las tecnologías son rejillas de caracteres calculadas en canvas.
- **Datos en directo de GitHub** a través de un Worker de Cloudflare con caché: commits recientes, lenguajes y mapa de actividad.
- **Español e inglés**, paleta de comandos (`Ctrl + K`) y diseño adaptado a móvil.

## Calidad

- **Vitest**: pruebas del intérprete COBOL contra el programa original (barajado, apuestas, ases, crupier, empates) y de la lógica del Worker.
- **Playwright**: recorridos en navegador real, en escritorio y en móvil (jugar una mano de BlackJack, cambiar de idioma, paleta de comandos, sin desbordamientos).
- **GitHub Actions**: lint, tipos, pruebas, build y pruebas en navegador en cada push.

```bash
npm test            # pruebas unitarias
npm run test:e2e    # pruebas en navegador
npm run typecheck
```

## Estructura

```
src/
  components/          Secciones de la página
    ejecutor/          Ventana que ejecuta cada proyecto (web, Java, Python, COBOL, cámara)
  lib/
    cobol/             Intérprete de COBOL y sus pruebas
    ascii.ts           Planeta de caracteres
    retrato.ts         Retrato en caracteres con lente
    logoAscii.ts       Logos de tecnologías en caracteres
    escenas.ts         Escenas generativas de los proyectos
    idioma.tsx         Español e inglés
  data/                Proyectos y tecnologías
worker/                Worker de Cloudflare: API de GitHub con caché
public/apps/           Jar del Tetris, página de Java, Python del gestor y COBOL del BlackJack
e2e/                   Pruebas de Playwright
```

## Mostrar un repositorio nuevo

La sección de GitHub muestra los repositorios que tengan la etiqueta (topic) **`portfolio`** en GitHub, además de los principales. Basta con añadir o quitar la etiqueta; no hace falta tocar el código.

## Desarrollo y despliegue

```bash
npm install
npm run dev         # solo la web, en http://localhost:5173
npm run worker      # web + Worker, en http://localhost:8787
npm run deploy      # compila y publica en Cloudflare
```

Opcional: un token de GitHub de solo lectura evita quedarse sin consultas a la API.

```bash
npx wrangler secret put GITHUB_TOKEN
```

---

Hecho por [Scheneider Baltazar](https://www.linkedin.com/in/scheneiderbz19/) · [GitHub](https://github.com/AldairBZ)
