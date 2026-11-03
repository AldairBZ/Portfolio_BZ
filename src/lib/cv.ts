import type { Idioma } from './idioma'

/** CV europeo de una página: en inglés para la web en inglés, en español para español y catalán */
export const rutaCv = (idioma: Idioma) =>
  idioma === 'en' ? '/cv/Scheneider_Baltazar_CV_EN.pdf' : '/cv/Scheneider_Baltazar_CV_ES.pdf'
