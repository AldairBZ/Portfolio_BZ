import { useEffect, useState } from 'react'
import { Cargando } from './Ejecutor'
import { useIdioma } from '../../lib/idioma'

const FUENTE =
  'https://raw.githubusercontent.com/AldairBZ/BlackJack-Proyecto-COBOL/main/backend/blackjack.cob.cbl'

const PALABRAS =
  /\b(IDENTIFICATION|PROCEDURE|DATA|WORKING-STORAGE|FILE|ENVIRONMENT|DIVISION|SECTION|PERFORM|UNTIL|VARYING|MOVE|TO|IF|ELSE|END-IF|COMPUTE|DISPLAY|ACCEPT|OPEN|CLOSE|READ|WRITE|STOP|RUN|PIC|VALUE|ADD|SUBTRACT|EVALUATE|WHEN|END-EVALUATE|END-PERFORM|FUNCTION|CALL|GO|EXIT)\b/g

function resaltar(linea: string) {
  if (/^\s*\*/.test(linea.slice(6, 7)) || linea.trimStart().startsWith('*>')) {
    return <span className="codigo__comentario">{linea}</span>
  }
  const partes: (string | React.ReactElement)[] = []
  let ultimo = 0
  for (const m of linea.matchAll(PALABRAS)) {
    partes.push(linea.slice(ultimo, m.index))
    partes.push(
      <span key={m.index} className="codigo__clave">
        {m[0]}
      </span>,
    )
    ultimo = m.index! + m[0].length
  }
  partes.push(linea.slice(ultimo))
  return partes
}

export default function EjecutorCodigo() {
  const [codigo, setCodigo] = useState<string[] | null>(null)
  const [error, setError] = useState(false)
  const { t } = useIdioma()

  useEffect(() => {
    fetch(FUENTE)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((texto) => setCodigo(texto.replace(/\r/g, '').split('\n')))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="codigo">
      <div className="codigo__esquema" aria-label={t('Arquitectura del proyecto', 'Project architecture')}>
        <span>{t('Interfaz', 'Interface')} · Python + Tkinter</span>
        <span className="codigo__flecha">⇄ BRIDGE.DAT ⇄</span>
        <span>{t('Motor', 'Engine')} · COBOL</span>
      </div>
      {!codigo && !error && <Cargando texto={t('Leyendo el código desde GitHub…', 'Reading the code from GitHub…')} />}
      {error && <Cargando texto={t('No se pudo leer el código. Puedes verlo en el repositorio.', 'The code could not be read. You can see it in the repository.')} />}
      {codigo && (
        <pre className="codigo__fuente" tabIndex={0}>
          <code>
            {codigo.map((linea, i) => (
              <span key={i} className="codigo__linea">
                <span className="codigo__numero" aria-hidden="true">
                  {i + 1}
                </span>
                {resaltar(linea)}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      )}
    </div>
  )
}
