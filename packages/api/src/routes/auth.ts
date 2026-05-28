import type { FastifyInstance } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'

export async function authRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const url = new URL(request.url, `${request.protocol}://${request.hostname}`)
      const headers = fromNodeHeaders(request.headers)
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })

      const response = await auth.handler(req)

      reply.status(response.status)
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })
      const bodyText = response.body ? await response.clone().text() : null
      return reply.send(bodyText)
    },
  })
}
