import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
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
    },
    async (req, reply) => {
      const session = await service.createBreakSession(req.body.workSessionId)
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
    },
    async (req, reply) => {
      const session = await service.updateBreakSession(
        req.params.id,
        req.body.action,
        req.body.consumedMs,
      )
      return reply.send(session)
    },
  )

  fastify.setErrorHandler(async (error, _req, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    return reply.status(statusCode).send({
      statusCode,
      error: 'Error',
      message: error.message,
    })
  })
}
