import { db } from '../db/client.js'
import { users, type UserRow } from '../db/schema.js'

interface GoogleProfile {
  sub: string
  email: string
  name: string
  picture?: string
}

export async function upsertUser(profile: GoogleProfile): Promise<UserRow> {
  const [row] = await db
    .insert(users)
    .values({
      googleId: profile.sub,
      email: profile.email,
      displayName: profile.name,
      pictureUrl: profile.picture ?? null,
    })
    .onConflictDoUpdate({
      target: users.googleId,
      set: {
        displayName: profile.name,
        pictureUrl: profile.picture ?? null,
      },
    })
    .returning()

  return row
}
