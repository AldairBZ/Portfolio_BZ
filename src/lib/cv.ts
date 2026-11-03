import type { Idioma } from './idioma'

/** El CV europeo de una página, en los tres idiomas de la web */
export const CVS: { idioma: Idioma; nombre: string; ruta: string }[] = [
  { idioma: 'es', nombre: 'Castellano', ruta: '/cv/Scheneider_Baltazar_CV_ES.pdf' },
  { idioma: 'ca', nombre: 'Català', ruta: '/cv/Scheneider_Baltazar_CV_CA.pdf' },
  { idioma: 'en', nombre: 'English', ruta: '/cv/Scheneider_Baltazar_CV_EN.pdf' },
]

export function descargarCv(ruta: string) {
  const enlace = document.createElement('a')
  enlace.href = ruta
  enlace.download = ''
  enlace.click()
}
