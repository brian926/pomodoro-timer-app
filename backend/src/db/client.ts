import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://pomo_user:pomo_pass@localhost:5432/pomo_timer'

const client = postgres(connectionString, { max: 5 })

export const db = drizzle(client, { schema })
