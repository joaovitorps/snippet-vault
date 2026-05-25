import Fastify from 'fastify'
import { config } from './env.js'
import { healthRoutes } from './routes/health.js'

const app = Fastify({ logger: config.isDevelopment })

if (config.isProduction) {
  await app.register(import('@fastify/helmet'))
  // Rate limiting is per-IP, not global. Each unique client gets its own 100 req/min bucket.
  // 100/min is generous for a scaffold — tighten per-route for auth/CRUD later (e.g. 5–10/min).
  // Docs: https://github.com/fastify/fastify-rate-limit
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  })
}

if (config.isDevelopment) {
  await app.register(import('@fastify/cors'), {
    origin: 'http://localhost:5173',
    credentials: true,
  })
}

await app.register(healthRoutes)

if (config.isProduction) {
  // In production, Fastify is the single server. @fastify/static serves web/dist/ at /.
  // SPA fallback: API misses return JSON 404, everything else serves index.html
  // so TanStack Router handles client-side routing (/snippets, /signin, etc.).
  // turbo.json "dependsOn": ["^build"] ensures web/dist/ exists before API references it.
  await app.register(import('@fastify/static'), {
    root: config.webDistPath,
    prefix: '/',
  })
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      return reply.code(404).send({ error: 'Not found' })
    }
    return reply.sendFile('index.html')
  })
}

try {
  await app.listen({ port: config.port, host: config.host })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
