import type { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session.get('userId')) {
    return reply.code(401).send({ error: 'unauthorized' })
  }
}
