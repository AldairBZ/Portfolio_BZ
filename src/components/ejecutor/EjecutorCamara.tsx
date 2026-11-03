import { useEffect, useRef, useState } from 'react'

// Mismos parámetros que la versión en C#, ajustados a una imagen de 320 x 240
const ANCHO = 320
const ALTO = 240
const UMBRAL_PIXEL = 25
const UMBRAL_MOVIMIENTO = 750 // 3000 píxeles a 640 x 480 equivalen a 750 a esta resolución

export default function EjecutorCamara() {
  const video = useRef<HTMLVideoElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const [estado, setEstado] = useState<'inicio' | 'activa' | 'denegada'>('inicio')
  const [pixeles, setPixeles] = useState(0)
  const flujo = useRef<MediaStream | null>(null)

  const encender = async () => {
    try {
      flujo.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      video.current!.srcObject = flujo.current
      await video.current!.play()
      setEstado('activa')
    } catch {
      setEstado('denegada')
    }
  }

  useEffect(() => {
    if (estado !== 'activa') return
    const ctx = lienzo.current!.getContext('2d', { willReadFrequently: true })!
    const visible = lienzo.current!
    let anterior: Uint8ClampedArray | null = null
    let frame = 0
    let ultimaMedida = 0

    const procesar = () => {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video.current!, -ANCHO, 0, ANCHO, ALTO)
      ctx.restore()
      const imagen = ctx.getImageData(0, 0, ANCHO, ALTO)
      const datos = imagen.data
      let cambiados = 0

      if (anterior) {
        const salida = ctx.createImageData(ANCHO, ALTO)
        for (let i = 0; i < datos.length; i += 4) {
          // AbsDiff y paso a gris, como en OpenCV
          const diff =
            0.299 * Math.abs(datos[i] - anterior[i]) +
            0.587 * Math.abs(datos[i + 1] - anterior[i + 1]) +
            0.114 * Math.abs(datos[i + 2] - anterior[i + 2])
          const gris = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2]
          if (diff > UMBRAL_PIXEL) {
            cambiados++
            salida.data[i] = 214
            salida.data[i + 1] = 80
            salida.data[i + 2] = 46
          } else {
            salida.data[i] = salida.data[i + 1] = salida.data[i + 2] = gris * 0.55
          }
          salida.data[i + 3] = 255
        }
        anterior = datos.slice()
        ctx.putImageData(salida, 0, 0)
      } else {
        anterior = datos.slice()
      }

      const ahora = performance.now()
      if (ahora - ultimaMedida > 120) {
        setPixeles(cambiados)
        ultimaMedida = ahora
      }
      visible.dataset.movimiento = String(cambiados > UMBRAL_MOVIMIENTO)
      frame = requestAnimationFrame(procesar)
    }
    frame = requestAnimationFrame(procesar)
    return () => cancelAnimationFrame(frame)
  }, [estado])

  useEffect(() => () => flujo.current?.getTracks().forEach((t) => t.stop()), [])

  const hayMovimiento = pixeles > UMBRAL_MOVIMIENTO

  return (
    <div className={`camara${hayMovimiento ? ' camara--movimiento' : ''}`}>
      <video ref={video} playsInline muted hidden />
      {estado !== 'activa' && (
        <div className="camara__inicio">
          <p>
            Compara cada fotograma con el anterior y cuenta los píxeles que cambian. Si cambian más de la cuenta, hay
            movimiento.
          </p>
          <button type="button" className="boton boton--lleno" onClick={encender}>
            Encender la cámara
          </button>
          {estado === 'denegada' && (
            <p className="camara__aviso">No se pudo acceder a la cámara. Revisa los permisos del navegador.</p>
          )}
          <p className="camara__privacidad">Todo se procesa en tu dispositivo. Nada se graba ni se envía.</p>
        </div>
      )}
      <canvas ref={lienzo} width={ANCHO} height={ALTO} className="camara__lienzo" hidden={estado !== 'activa'} />
      {estado === 'activa' && (
        <div className="camara__datos">
          <span className="etiqueta">Píxeles cambiados</span>
          <strong>{pixeles.toLocaleString('es')}</strong>
          <span className="camara__estado">{hayMovimiento ? 'Movimiento detectado' : 'Sin movimiento'}</span>
          <span className="etiqueta">Umbral: {UMBRAL_MOVIMIENTO} px</span>
        </div>
      )}
    </div>
  )
}
