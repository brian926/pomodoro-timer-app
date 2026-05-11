import Fastify from 'fastify'
import cors from '@fastify/cors'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { workSessionsRoutes } from './routes/workSessions.js'
import { breakSessionsRoutes } from './routes/breakSessions.js'
import { statsRoutes } from './routes/stats.js'

export async function buildServer() {
  const fastify = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  })

  fastify.register(workSessionsRoutes, { prefix: '/api/sessions/work' })
  fastify.register(breakSessionsRoutes, { prefix: '/api/sessions/break' })
  fastify.register(statsRoutes, { prefix: '/api/stats' })

  fastify.get('/api/health', async () => ({ status: 'ok' }))

  return fastify
}

async function startServer() {
  const server = await buildServer()
  const port = Number(process.env.PORT ?? 3001)
  try {
    await server.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

startServer()
