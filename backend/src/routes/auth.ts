import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { upsertUser } from '../services/userService.js'

interface GoogleUserInfo {
  sub: string
  name: string
  email: string
  picture?: string
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/api/auth/google/callback', async (req, reply) => {
    try {
      const token =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req, reply)

      const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${token.token.access_token as string}` },
      })

      if (!userInfoRes.ok) {
        throw new Error(`Google userinfo fetch failed: ${userInfoRes.status}`)
      }

      const profile = (await userInfoRes.json()) as GoogleUserInfo
      const user = await upsertUser(profile)

      req.session.set('userId', user.id)

      return reply.redirect(process.env.FRONTEND_URL ?? 'http://localhost:5173')
    } catch (err) {
      fastify.log.error(err)
      return reply.redirect(
        `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}?error=login_failed`,
      )
    }
  })

  fastify.get('/api/auth/me', async (req, reply) => {
    const userId = req.session.get('userId')
    if (!userId) return reply.code(401).send({ error: 'unauthorized' })

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) return reply.code(401).send({ error: 'unauthorized' })

    return reply.send({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
    })
  })

  fastify.post('/api/auth/logout', async (req, reply) => {
    req.session.delete()
    return reply.send({ ok: true })
  })
}
