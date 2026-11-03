import { responderGitHub } from '../../servidor/github'
import type { Entorno } from '../../servidor/visitas'

// Repos, commits y mapa de actividad de GitHub, con caché
export const onRequestGet: PagesFunction<Entorno> = ({ request, env, waitUntil }) =>
  responderGitHub(request, { waitUntil }, env.GITHUB_TOKEN)
