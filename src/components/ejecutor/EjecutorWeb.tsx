import { useState } from 'react'
import { Cargando } from './Ejecutor'
import { useIdioma } from '../../lib/idioma'

export default function EjecutorWeb({ url, titulo }: { url: string; titulo: string }) {
  const [cargado, setCargado] = useState(false)
  const { t } = useIdioma()

  return (
    <>
      {!cargado && <Cargando texto={t('Cargando la aplicación…', 'Loading the app…')} />}
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
