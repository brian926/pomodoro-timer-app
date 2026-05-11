# Data Model: Custom Pomodoro Timer

**Branch**: `001-pomodoro-timer` | **Date**: 2026-05-08

## Entities

### WorkSession

Represents a single continuous working interval from Start to Stop.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique session identifier |
| started_at | TIMESTAMPTZ | NOT NULL | Wall-clock time when Work timer was started (or last resumed) — used for drift-correction display only; not authoritative for duration |
| ended_at | TIMESTAMPTZ | NULL | Wall-clock time when Stop was pressed; NULL while session is in progress |
| duration_ms | INTEGER | NOT NULL, ≥ 0 | Total elapsed work time in milliseconds (excludes all paused time) |
| paused_duration_ms | INTEGER | NOT NULL, DEFAULT 0 | Total milliseconds spent paused during this session |
| break_bank_ms | INTEGER | NOT NULL, DEFAULT 0 | Calculated break credit; set when session is stopped |
| status | work_status | NOT NULL | One of: `running`, `paused`, `stopped` |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |

**State transitions**:
```
idle → running  (Start pressed)
running → paused (Pause pressed)
paused → running (Resume pressed)
running → stopped (Stop pressed)
paused → stopped (Stop pressed)
```

**Invariants**:
- `ended_at` MUST be set when `status = 'stopped'`.
- `break_bank_ms` MUST be calculated and set atomically with the status transition to `stopped`.
- `duration_ms` = total elapsed time computed client-side; persisted to DB on stop.

---

### BreakSession

Represents a single countdown break interval derived from a WorkSession's break bank.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique break session identifier |
| work_session_id | UUID | FK → WorkSession.id, NOT NULL | The work session whose break bank funded this break |
| initial_bank_ms | INTEGER | NOT NULL, > 0 | Break bank at the time the break started (full allocation) |
| consumed_ms | INTEGER | NOT NULL, DEFAULT 0 | Milliseconds of break actually taken (≤ initial_bank_ms) |
| status | break_status | NOT NULL | One of: `running`, `paused`, `completed`, `stopped_early` |
| started_at | TIMESTAMPTZ | NOT NULL | When the Break timer was started |
| ended_at | TIMESTAMPTZ | NULL | When the Break timer ended (completed or stopped early) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Record creation timestamp |

**State transitions**:
```
(created) → running  (Start Break pressed)
running → paused (Pause pressed)
paused → running (Resume pressed)
running → completed (countdown reaches 0)
running → stopped_early (Stop pressed before 0)
paused → stopped_early (Stop pressed before 0)
```

**Invariants**:
- `consumed_ms` ≤ `initial_bank_ms` always.
- `status = 'completed'` only when `consumed_ms = initial_bank_ms`.
- `ended_at` MUST be set when status is `completed` or `stopped_early`.

---

### DailyStats (Computed View)

Not a stored table — computed from WorkSession and BreakSession records grouped by
the calendar date of `started_at` in the user's local timezone.

| Field | Type | Description |
|-------|------|-------------|
| date | DATE | Calendar date |
| total_work_ms | BIGINT | Sum of `duration_ms` across all WorkSessions for the date |
| total_break_ms | BIGINT | Sum of `consumed_ms` across all BreakSessions for the date |
| work_session_count | INTEGER | Number of WorkSessions for the date |

---

## Enums

```sql
CREATE TYPE work_status AS ENUM ('running', 'paused', 'stopped');
CREATE TYPE break_status AS ENUM ('running', 'paused', 'completed', 'stopped_early');
```

---

## Relationships

```
WorkSession 1 ──< BreakSession (one work session can fund at most one break session in v1)
```

---

## Client-Side State (Zustand Store)

Complements the DB model. Holds in-memory timer state for the active session.
Persisted to `localStorage` via Zustand persist middleware to survive page refreshes.

```typescript
type TimerMode =
  | 'idle'
  | 'working'
  | 'paused-work'
  | 'break'
  | 'paused-break';

interface TimerStore {
  mode: TimerMode;

  // Work timer state
  workSessionId: string | null;       // DB session ID (set after POST /sessions/work)
  workStartTimestamp: number | null;  // Date.now() at last start or resume
  totalWorkMs: number;                // Accumulated work time (persisted across pauses)
  totalPausedMs: number;              // Accumulated pause time within current session

  // Break timer state
  breakSessionId: string | null;
  breakBankMs: number;                // Available break time
  breakStartTimestamp: number | null;
  totalBreakConsumedMs: number;       // Consumed during current break session

  // Actions
  startWork: () => Promise<void>;
  pauseWork: () => void;
  resumeWork: () => void;
  stopWork: () => Promise<void>;
  startBreak: () => Promise<void>;
  pauseBreak: () => void;
  resumeBreak: () => void;
  stopBreak: () => Promise<void>;
  onBreakComplete: () => Promise<void>;
  reset: () => void;
}
```

---

## Break Bank Calculation (canonical implementation location)

Lives in `frontend/src/utils/breakBank.ts` (shared logic; also importable by backend
for server-side validation).

Inputs: `workMs: number` (total work milliseconds, non-negative)
Output: `number` (break bank milliseconds, non-negative)

Reference the algorithm in `research.md §Break Bank Calculation Algorithm`.

---

## Database Migration File (Drizzle Kit)

`backend/src/db/schema.ts` defines the Drizzle schema that generates SQL migrations.
Migration files live in `backend/drizzle/` and are committed to version control.
Run `pnpm --filter backend db:migrate` to apply migrations against the local Docker DB.
