import {
  pgTable,
  uuid,
  timestamp,
  integer,
  pgEnum,
  varchar,
  text,
  index,
} from 'drizzle-orm/pg-core'

export const workStatusEnum = pgEnum('work_status', ['running', 'paused', 'stopped'])
export const breakStatusEnum = pgEnum('break_status', [
  'running',
  'paused',
  'completed',
  'stopped_early',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    googleId: varchar('google_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    pictureUrl: text('picture_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    googleIdIdx: index('users_google_id_idx').on(table.googleId),
  }),
)

export const workSessions = pgTable('work_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationMs: integer('duration_ms').notNull().default(0),
  pausedDurationMs: integer('paused_duration_ms').notNull().default(0),
  breakBankMs: integer('break_bank_ms').notNull().default(0),
  status: workStatusEnum('status').notNull().default('running'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const breakSessions = pgTable('break_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  workSessionId: uuid('work_session_id')
    .notNull()
    .references(() => workSessions.id),
  initialBankMs: integer('initial_bank_ms').notNull(),
  consumedMs: integer('consumed_ms').notNull().default(0),
  status: breakStatusEnum('status').notNull().default('running'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserRow = typeof users.$inferSelect
export type WorkSessionRow = typeof workSessions.$inferSelect
export type BreakSessionRow = typeof breakSessions.$inferSelect
