import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { requireAuth } from '../middleware/requireAuth.js'
import * as service from '../services/breakSessionService.js'

const BreakSessionSchema = Type.Object({
  id: Type.String(),
  workSessionId: Type.String(),
  status: Type.String(),
  initialBankMs: Type.Number(),
  consumedMs: Type.Number(),
  startedAt: Type.String(),
  endedAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
})

export const breakSessionsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    '/',
    {
      schema: {
        body: Type.Object({ workSessionId: Type.String() }),
        response: { 201: BreakSessionSchema },
      },
      preHandler: requireAuth,
    },
    async (req, reply) => {
      const userId = req.session.get('userId')!
      const session = await service.createBreakSession(req.body.workSessionId, userId)
      return reply.status(201).send(session)
    },
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Object({
          action: Type.Union([
            Type.Literal('pause'),
            Type.Literal('resume'),
            Type.Literal('stop'),
            Type.Literal('complete'),
          ]),
          consumedMs: Type.Number({ minimum: 0 }),
        }),
        response: { 200: BreakSessionSchema },
      },
      preHandler: requireAuth,
    },
    async (req, reply) => {
      const userId = req.session.get('userId')!
      const session = await service.updateBreakSession(
        req.params.id,
        userId,
        req.body.action,
        req.body.consumedMs,
      )
      return reply.send(session)
    },
  )

  fastify.setErrorHandler(async (error: Error & { statusCode?: number }, _req, reply) => {
    const statusCode = error.statusCode ?? 500
    return reply.status(statusCode).send({
      statusCode,
      error: 'Error',
      message: error.message,
    })
  })
}
