import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
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
    { schema: { response: { 201: WorkSessionSchema } } },
    async (_req, reply) => {
      const session = await service.createSession()
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
    },
    async (req, reply) => {
      const session = await service.getSession(req.params.id)
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
    },
    async (req, reply) => {
      const { action, durationMs, pausedDurationMs } = req.body
      const session = await service.updateSession(req.params.id, action, durationMs, pausedDurationMs)
      return reply.send(session)
    },
  )

  // Handle service errors as HTTP responses
  fastify.setErrorHandler(async (error, _req, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    return reply.status(statusCode).send({
      statusCode,
      error: reply.statusCode === 409 ? 'Conflict' : 'Error',
      message: error.message,
    })
  })
}
