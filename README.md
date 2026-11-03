# Portfolio · Scheneider Baltazar

Mi portfolio como desarrollador Full Stack. Los proyectos no se enseñan con capturas: se ejecutan dentro de la página.

![React](https://img.shields.io/badge/React-19-149eca) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Vite](https://img.shields.io/badge/Vite-8-646cff) ![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-88ce02)

## Qué tiene de especial

- **Proyectos ejecutables en el navegador**
  - **TetrisGame**: el `.jar` original de Java 21 corre con [CheerpJ](https://cheerpj.com), con controles táctiles en el móvil.
  - **Gestor Bon Gust**: el `main.py` original corre con [Pyodide](https://pyodide.org) y SQLite en una terminal propia. Un transformador de AST convierte sus `input()` en esperas asíncronas sin tocar el archivo.
  - **Detección de movimiento**: el algoritmo de la versión en C# (AbsDiff, gris, umbral, recuento de píxeles) portado a canvas, con la cámara del dispositivo.
  - **BlackJack en COBOL**: el `blackjack.cob.cbl` original se ejecuta con un intérprete de COBOL escrito en TypeScript (`src/lib/cobol`), con el mismo intercambio por `BRIDGE.DAT` que la versión de escritorio.
  - **LifeLevelUp** y la web de Resident Evil se abren integradas.
- **Ilustraciones hechas con código**: el planeta de la portada es una rejilla de caracteres que calcula luz, relieve y rotación en cada fotograma. Cada proyecto tiene su propia escena generativa en canvas, que solo se anima cuando está a la vista.
- **Datos en directo** de la API de GitHub: últimos commits y lenguajes, con caché en `sessionStorage`.
- **Paleta de comandos** con `Ctrl + K` para ir a cualquier sección o ejecutar un proyecto desde el teclado.
- Scroll con Lenis y GSAP ScrollTrigger, carga diferida de cada entorno de ejecución y diseño adaptado a móvil.

## Estructura

```
src/
  components/          Secciones de la página
    ejecutor/          Ventana que ejecuta cada proyecto (web, Java, Python, cámara, código)
  lib/
    ascii.ts           Motor del planeta de caracteres
    escenas.ts         Escenas generativas de los proyectos
    scroll.ts          Lenis + ScrollTrigger
  data/proyectos.ts    Datos de los proyectos
public/apps/           Jar del Tetris y archivos Python del gestor
```

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

---

Hecho por [Scheneider Baltazar](https://www.linkedin.com/in/scheneiderbz19/) · [GitHub](https://github.com/AldairBZ)
