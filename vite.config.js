import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // En dev, les fonctions Vercel (api/) ne tournent pas : on monte la même
  // logique de proxy MAL en middleware, avec les clés lues depuis .env.local.
  const env = loadEnv(mode, process.cwd(), '')
  process.env.MAL_CLIENT_ID = env.MAL_CLIENT_ID
  process.env.MAL_CLIENT_SECRET = env.MAL_CLIENT_SECRET

  return {
    plugins: [
      react(),
      {
        name: 'mal-proxy-dev',
        configureServer(server) {
          server.middlewares.use('/api/mal', async (req, res) => {
            const { proxyCatalogue, echangeToken } = await import('./api/_lib/malProxy.js')
            const url = new URL(req.url, 'http://localhost')
            if (url.pathname === '/token') {
              return echangeToken(req, res)
            }
            if (url.pathname === '/proxy') {
              const chemin = url.searchParams.get('path') ?? ''
              return proxyCatalogue(req, res, chemin)
            }
            res.statusCode = 404
            res.end('Not found')
          })
        },
      },
    ],
  }
})
