import { Type } from '@sinclair/typebox'
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { requireAuth } from '../middleware/requireAuth.js'
import * as service from '../services/statsService.js'

export const statsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/daily',
    {
      schema: {
        querystring: Type.Object({
          date: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
          timezone: Type.Optional(Type.String()),
        }),
        response: {
          200: Type.Object({
            date: Type.String(),
            totalWorkMs: Type.Number(),
            totalBreakMs: Type.Number(),
            workSessionCount: Type.Number(),
          }),
          400: Type.Object({
            statusCode: Type.Number(),
            error: Type.String(),
            message: Type.String(),
          }),
        },
      },
      preHandler: requireAuth,
    },
    async (req, reply) => {
      const { date, timezone } = req.query
      const today = new Date().toISOString().slice(0, 10)
      if (date > today) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'date cannot be in the future' })
      }
      const userId = req.session.get('userId')!
      const stats = await service.getDailyStats(date, userId, timezone)
      return reply.send(stats)
    },
  )
}
