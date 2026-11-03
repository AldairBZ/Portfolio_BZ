import { responderGitHub } from './github'
import { mostrarPanel, registrarEvento, type Entorno } from './visitas'

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/github' && request.method === 'GET') return responderGitHub(request, ctx, env.GITHUB_TOKEN)
    if (pathname === '/api/visita' && request.method === 'POST') return registrarEvento(request, env)
    if (pathname === '/panel') return mostrarPanel(request, env)

    // Todo lo demás es la web estática
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Entorno>
