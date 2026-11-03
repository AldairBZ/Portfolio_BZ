import { useEffect, useRef, useState } from 'react'
import './CodigoVivo.css'

// Método real de TetrisGame (Board.java)
const CODIGO = `public int clearLines() {
    int linesCleared = 0;
    for (int row = 0; row < height; row++) {
        boolean full = true;
        for (int col = 0; col < width; col++) {
            if (grid[row][col] == null) {
                full = false;
                break;
            }
        }
        if (full) {
            linesCleared++;
            for (int r = row; r > 0; r--) {
                grid[r] = grid[r - 1];
            }
            grid[0] = new Color[width];
        }
    }
    return linesCleared;
}`

const CLAVES = /\b(public|int|for|boolean|if|break|return|new|true|false|null)\b/g

function resaltar(texto: string) {
  const partes: React.ReactNode[] = []
  let ultimo = 0
  for (const m of texto.matchAll(CLAVES)) {
    partes.push(texto.slice(ultimo, m.index))
    partes.push(
      <span key={m.index} className="vivo__clave">
        {m[0]}
      </span>,
    )
    ultimo = m.index! + m[0].length
  }
  partes.push(texto.slice(ultimo))
  return partes
}

export default function CodigoVivo() {
  const raiz = useRef<HTMLDivElement>(null)
  const [escritos, setEscritos] = useState(0)

  useEffect(() => {
    let intervalo = 0
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || intervalo) return
        intervalo = window.setInterval(() => {
          setEscritos((n) => {
            if (n >= CODIGO.length) {
              clearInterval(intervalo)
              return n
            }
            // Los espacios de sangría se escriben de golpe, como en un editor
            let siguiente = n + 1
            while (CODIGO[siguiente] === ' ' && CODIGO[siguiente - 1] === ' ') siguiente++
            return siguiente
          })
        }, 14)
      },
      { threshold: 0.4 },
    )
    observador.observe(raiz.current!)
    return () => {
      observador.disconnect()
      clearInterval(intervalo)
    }
  }, [])

  const lineas = CODIGO.slice(0, escritos).split('\n')

  return (
    <div className="vivo" ref={raiz}>
      <div className="vivo__barra">
        <span className="vivo__puntos" aria-hidden="true" />
        <span>TetrisGame / Board.java</span>
        <span className="vivo__test">BoardTest · 7 tests JUnit</span>
      </div>
      <pre className="vivo__codigo" aria-label="Método clearLines de TetrisGame">
        <code>
          {lineas.map((linea, i) => (
            <span key={i} className="vivo__linea">
              <span className="vivo__numero" aria-hidden="true">
                {31 + i}
              </span>
              {resaltar(linea)}
              {i === lineas.length - 1 && <span className="vivo__cursor" aria-hidden="true" />}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
