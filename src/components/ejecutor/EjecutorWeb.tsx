import { useState } from 'react'
import { Cargando } from './Ejecutor'

export default function EjecutorWeb({ url, titulo }: { url: string; titulo: string }) {
  const [cargado, setCargado] = useState(false)

  return (
    <>
      {!cargado && <Cargando texto="Cargando la aplicación…" />}
      <iframe
        src={url}
        title={titulo}
        onLoad={() => setCargado(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          background: '#fff',
          opacity: cargado ? 1 : 0,
          transition: 'opacity 0.5s',
        }}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </>
  )
}
