const cargados = new Map<string, Promise<void>>()

/** Carga un script externo una sola vez, aunque se pida varias veces */
export function cargarScript(src: string) {
  let promesa = cargados.get(src)
  if (!promesa) {
    promesa = new Promise<void>((resolver, rechazar) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolver()
      script.onerror = () => {
        cargados.delete(src)
        rechazar(new Error(`No se pudo cargar ${src}`))
      }
      document.head.appendChild(script)
    })
    cargados.set(src, promesa)
  }
  return promesa
}
