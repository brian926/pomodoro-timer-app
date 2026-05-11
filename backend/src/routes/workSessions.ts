import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { requireAuth } from '../middleware/requireAuth.js'
import * as service from '../services/workSessionService.js'

const WorkSessionSchema = Type.Object({
  id: Type.String(),
  status: Type.String(),
  startedAt: Type.String(),
  endedAt: Type.Union([Type.String(), Type.Null()]),
  durationMs: Type.Number(),
  pausedDurationMs: Type.Number(),
  breakBankMs: Type.Number(),
  createdAt: Type.String(),
})

export const workSessionsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/',
    { schema: { response: { 201: WorkSessionSchema } }, preHandler: requireAuth },
    async (req, reply) => {
      const userId = req.session.get('userId')!
      const session = await service.createSession(userId)
      return reply.status(201).send(session)
    },
  )

  fastify.get(
    '/:id',
    {
      schema: {
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: { 200: WorkSessionSchema },
      },
      preHandler: requireAuth,
    },
    async (req, reply) => {
      const userId = req.session.get('userId')!
      const session = await service.getSession(req.params.id, userId)
      return reply.send(session)
    },
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        body: Type.Object({
          action: Type.Union([
            Type.Literal('pause'),
            Type.Literal('resume'),
            Type.Literal('stop'),
          ]),
          durationMs: Type.Number({ minimum: 0 }),
          pausedDurationMs: Type.Number({ minimum: 0 }),
        }),
        response: { 200: WorkSessionSchema },
      },
      preHandler: requireAuth,
    },
    async (req, reply) => {
      const userId = req.session.get('userId')!
      const { action, durationMs, pausedDurationMs } = req.body
      const session = await service.updateSession(req.params.id, userId, action, durationMs, pausedDurationMs)
      return reply.send(session)
    },
  )

  fastify.setErrorHandler(async (error: Error & { statusCode?: number }, _req, reply) => {
    const statusCode = error.statusCode ?? 500
    return reply.status(statusCode).send({
      statusCode,
      error: statusCode === 409 ? 'Conflict' : 'Error',
      message: error.message,
    })
  })
}
