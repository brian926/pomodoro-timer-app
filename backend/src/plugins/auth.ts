import type { FastifyInstance } from 'fastify'
import secureSession from '@fastify/secure-session'
import oauthPlugin from '@fastify/oauth2'
import type { OAuth2Namespace } from '@fastify/oauth2'

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
}

declare module '@fastify/secure-session' {
  interface SessionData {
    userId: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerAuth(fastify: FastifyInstance<any, any, any, any, any>) {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be at least 32 characters')
  }

  await fastify.register(secureSession, {
    secret,
    salt: 'pomotimer-saltv1',
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400,
    },
  })

  const callbackUri =
    `${process.env.BACKEND_URL ?? 'http://localhost:3001'}/api/auth/google/callback`

  await fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID ?? '',
        secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/api/auth/google',
    callbackUri,
    scope: ['openid', 'profile', 'email'],
  })
}
