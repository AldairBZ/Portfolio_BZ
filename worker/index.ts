import { responderGitHub } from './github'

// Secreto opcional (wrangler secret put GITHUB_TOKEN): sube el límite de la API de GitHub
interface Entorno extends Env {
  GITHUB_TOKEN?: string
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/github' && request.method === 'GET') return responderGitHub(request, ctx, env.GITHUB_TOKEN)

    // Todo lo demás es la web estática
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Entorno>
