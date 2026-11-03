# Portfolio_BZ · Scheneider Baltazar

Mi portfolio como desarrollador Full Stack: **[scheneiderbz.pages.dev](https://scheneiderbz.pages.dev/?ref=github)**. Los proyectos no se enseñan con capturas: se ejecutan dentro de la página.

[![CI](https://github.com/AldairBZ/Portfolio_BZ/actions/workflows/ci.yml/badge.svg)](https://github.com/AldairBZ/Portfolio_BZ/actions/workflows/ci.yml) ![React](https://img.shields.io/badge/React-19-149eca) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages%20%2B%20D1-f38020)

## Qué tiene de especial

- **Proyectos ejecutables en el navegador**
  - **TetrisGame**: el `.jar` original de Java 21 corre con [CheerpJ](https://cheerpj.com) dentro de un iframe de tamaño fijo que se escala a cualquier pantalla, con controles táctiles en el móvil.
  - **Gestor Bon Gust**: el `main.py` original corre con [Pyodide](https://pyodide.org) y SQLite en una terminal propia. Un transformador de AST convierte sus `input()` en esperas asíncronas sin tocar el archivo.
  - **BlackJack en COBOL**: el `blackjack.cob.cbl` original se ejecuta con un **intérprete de COBOL escrito en TypeScript** (`src/lib/cobol`), con el mismo intercambio por `BRIDGE.DAT` que la versión de escritorio.
  - **Detección de movimiento**: el algoritmo de la versión en C# portado a canvas, con la cámara del dispositivo.
  - **LifeLevelUp** y la web de Resident Evil se abren integradas.
- **Todo dibujado con caracteres**: el planeta de la portada, el retrato, los logos de las tecnologías y el dragón que sigue al cursor al final de la página. Las ventanas de los proyectos muestran capturas reales de cada uno convertidas a caracteres con sus colores, y una lente deja ver la original.
- **Datos en directo de GitHub** a través de una función de Cloudflare con caché: commits recientes, lenguajes y mapa de actividad.
- **Contador de visitas propio y anónimo** (sin cookies ni IP) en Cloudflare D1: cuenta personas distintas, no clics repetidos, y dice si llegan desde LinkedIn, GitHub o directamente (los enlaces llevan `?ref=linkedin` o `?ref=github`). Todo en un panel privado escondido en la web.
- **Español, catalán e inglés**, elegido según las preferencias del navegador; paleta de comandos (`Ctrl + K`) y diseño adaptado a móvil.

## Calidad

- **Vitest**: pruebas del intérprete COBOL contra el programa original (barajado, apuestas, ases, crupier, empates), del servidor y de que no falte ninguna traducción al catalán.
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
    capturaAscii.ts    Capturas de los proyectos en caracteres
    terminalAscii.ts   Sesión real del programa de consola de Bon Gust
    dragonAscii.ts     Dragón que sigue al cursor
    escenas.ts         Escenas generativas de los proyectos
    idioma.tsx         Español, catalán e inglés
    catalan.ts         Traducción al catalán
    analitica.ts       Contador de visitas anónimo
  data/                Proyectos y tecnologías
functions/api/         Funciones de Cloudflare Pages: GitHub, eventos y panel
servidor/              Lógica de esas funciones y sus pruebas
migrations/            Esquema de la base de datos D1
public/apps/           Jar del Tetris, página de Java, Python del gestor y COBOL del BlackJack
public/proyectos/      Capturas reales de cada proyecto
e2e/                   Pruebas de Playwright
```

## Mostrar un repositorio nuevo

La sección de GitHub muestra los repositorios que tengan la etiqueta (topic) **`portfolio`** en GitHub, además de los principales. Basta con añadir o quitar la etiqueta; no hace falta tocar el código.

## Desarrollo y despliegue

```bash
npm install
npm run dev         # solo la web, en http://localhost:5173
npm run servidor    # web + funciones + base de datos local, en http://localhost:8787
npm run deploy      # compila y publica en Cloudflare
```

Configuración en Cloudflare (una sola vez):

```bash
npx wrangler pages project create scheneiderbz --production-branch main
npx wrangler d1 create portfolio-visitas              # y copiar el id en wrangler.jsonc
npx wrangler d1 migrations apply portfolio-visitas --remote
npx wrangler pages secret put PANEL_USUARIO --project-name scheneiderbz
npx wrangler pages secret put PANEL_CLAVE --project-name scheneiderbz
npx wrangler pages secret put GITHUB_TOKEN --project-name scheneiderbz   # opcional
```

El usuario y la clave del panel solo existen como secretos en Cloudflare; no están en el código.

---

Hecho por [Scheneider Baltazar](https://www.linkedin.com/in/scheneiderbz19/) · [GitHub](https://github.com/AldairBZ)
