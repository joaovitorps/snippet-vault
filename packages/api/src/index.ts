import Fastify from 'fastify'
import { config } from './env.js'
import { healthRoutes } from './routes/health.js'

const app = Fastify({ logger: config.isDevelopment })

if (config.isProduction) {
  await app.register(import('@fastify/helmet'))
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
