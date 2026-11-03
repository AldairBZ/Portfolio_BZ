import {
  siApachemaven,
  siCloudflare,
  siCss,
  siDotnet,
  siExpress,
  siGit,
  siGithubactions,
  siGsap,
  siHibernate,
  siHtml5,
  siJavascript,
  siJsonwebtokens,
  siJunit5,
  siMongodb,
  siMysql,
  siNodedotjs,
  siOpencv,
  siOpenjdk,
  siPython,
  siReact,
  siSpringboot,
  siSqlite,
  siTypescript,
  siVite,
} from 'simple-icons'
import type { FormaLogo } from '../lib/logoAscii'
import { CATALAN } from '../lib/catalan'
import type { Texto } from '../lib/idioma'

export interface Tecnologia {
  nombre: string
  forma: FormaLogo
  /** Dónde la he usado */
  uso: Texto
}

export interface GrupoTecnologias {
  grupo: Texto
  tecnologias: Tecnologia[]
}

const logo = (icono: { path: string; hex: string }): FormaLogo => ({ ruta: icono.path, color: icono.hex })
const PORTFOLIO = { es: 'este portfolio', en: 'this portfolio' }
const usos = (...partes: (string | Texto)[]): Texto => ({
  es: partes.map((p) => (typeof p === 'string' ? p : p.es)).join(', '),
  en: partes.map((p) => (typeof p === 'string' ? p : p.en)).join(', '),
  ca: partes.map((p) => (typeof p === 'string' ? p : (p.ca ?? CATALAN[p.es] ?? p.es))).join(', '),
})

export const tecnologias: GrupoTecnologias[] = [
  {
    grupo: { es: 'Backend', en: 'Backend' },
    tecnologias: [
      { nombre: 'Java', forma: logo(siOpenjdk), uso: usos('TetrisGame', { es: 'bootcamp', en: 'bootcamp' }) },
      { nombre: 'Spring Boot', forma: logo(siSpringboot), uso: usos({ es: 'bootcamp', en: 'bootcamp' }) },
      { nombre: 'Hibernate', forma: logo(siHibernate), uso: usos({ es: 'bootcamp', en: 'bootcamp' }) },
      { nombre: 'Node.js', forma: logo(siNodedotjs), uso: usos('LifeLevelUp') },
      { nombre: 'Express', forma: logo(siExpress), uso: usos('LifeLevelUp') },
      { nombre: 'JWT · OAuth 2.0', forma: logo(siJsonwebtokens), uso: usos('LifeLevelUp') },
      { nombre: 'Python', forma: logo(siPython), uso: usos('Gestor Bon Gust', 'BlackJack') },
      { nombre: 'C# · .NET', forma: logo(siDotnet), uso: usos({ es: 'Detección de movimiento', en: 'Motion detection' }) },
      { nombre: 'OpenCV', forma: logo(siOpencv), uso: usos({ es: 'Detección de movimiento', en: 'Motion detection' }) },
      { nombre: 'COBOL', forma: { texto: 'COBOL', color: 'e9b7a6' }, uso: usos('BlackJack') },
    ],
  },
  {
    grupo: { es: 'Frontend', en: 'Frontend' },
    tecnologias: [
      { nombre: 'React', forma: logo(siReact), uso: usos('LifeLevelUp', PORTFOLIO) },
      { nombre: 'TypeScript', forma: logo(siTypescript), uso: usos(PORTFOLIO) },
      { nombre: 'JavaScript', forma: logo(siJavascript), uso: usos('LifeLevelUp') },
      { nombre: 'HTML5', forma: logo(siHtml5), uso: usos('Resident Evil Web', PORTFOLIO) },
      { nombre: 'CSS', forma: logo(siCss), uso: usos('Resident Evil Web', PORTFOLIO) },
      { nombre: 'Vite', forma: logo(siVite), uso: usos('LifeLevelUp', PORTFOLIO) },
      { nombre: 'GSAP', forma: logo(siGsap), uso: usos(PORTFOLIO) },
    ],
  },
  {
    grupo: { es: 'Datos', en: 'Data' },
    tecnologias: [
      { nombre: 'MySQL', forma: logo(siMysql), uso: usos('TetrisGame') },
      { nombre: 'MongoDB', forma: logo(siMongodb), uso: usos('LifeLevelUp') },
      { nombre: 'SQLite', forma: logo(siSqlite), uso: usos('Gestor Bon Gust') },
    ],
  },
  {
    grupo: { es: 'Calidad y entrega', en: 'Quality & delivery' },
    tecnologias: [
      { nombre: 'JUnit', forma: logo(siJunit5), uso: usos('TetrisGame') },
      { nombre: 'Maven', forma: logo(siApachemaven), uso: usos('TetrisGame') },
      { nombre: 'Git', forma: logo(siGit), uso: usos({ es: 'todos mis proyectos', en: 'all my projects' }) },
      { nombre: 'GitHub Actions', forma: logo(siGithubactions), uso: usos('TetrisGame', 'LifeLevelUp', PORTFOLIO) },
      { nombre: 'Cloudflare', forma: logo(siCloudflare), uso: usos('LifeLevelUp', PORTFOLIO) },
      {
        nombre: 'Azure',
        forma: { texto: 'AZ', color: '5f8fc4' },
        uso: { es: 'certificaciones AZ-900, AI-900, DP-900 y SC-900', en: 'AZ-900, AI-900, DP-900 and SC-900 certifications' },
      },
    ],
  },
]
