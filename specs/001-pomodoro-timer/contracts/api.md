# API Contract: Custom Pomodoro Timer

**Branch**: `001-pomodoro-timer` | **Date**: 2026-05-08  
**Base URL**: `http://localhost:3001/api`  
**Format**: JSON (Content-Type: application/json)

---

## Work Sessions

### POST /sessions/work

Create a new work session. Call when the user presses Start.

**Request body**: _(empty)_

**Response 201**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "startedAt": "2026-05-08T14:30:00.000Z",
  "durationMs": 0,
  "breakBankMs": 0
}
```

**Errors**:
- `409 Conflict` — another session is already `running` or `paused`

---

### PATCH /sessions/work/:id

Update the state of an active work session (pause, resume, or stop).

**Request body**:
```json
{
  "action": "pause" | "resume" | "stop",
  "durationMs": 1500000,
  "pausedDurationMs": 30000
}
```

- `durationMs`: Total elapsed work time in ms (computed client-side, authoritative).
- `pausedDurationMs`: Total paused time in ms (included so server can validate).
- `action`: The transition to apply.

**Response 200** (on `stop`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "stopped",
  "durationMs": 1500000,
  "breakBankMs": 300000,
  "endedAt": "2026-05-08T15:55:00.000Z"
}
```

**Response 200** (on `pause` or `resume`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "paused" | "running",
  "durationMs": 750000
}
```

**Errors**:
- `404 Not Found` — session ID does not exist
- `409 Conflict` — action is invalid for the current status (e.g., `resume` when `running`)
- `422 Unprocessable Entity` — `durationMs` is negative or exceeds wall-clock elapsed time by more than 5 seconds

---

### GET /sessions/work/:id

Retrieve a specific work session.

**Response 200**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "stopped",
  "startedAt": "2026-05-08T14:30:00.000Z",
  "endedAt": "2026-05-08T15:55:00.000Z",
  "durationMs": 1500000,
  "pausedDurationMs": 30000,
  "breakBankMs": 300000,
  "createdAt": "2026-05-08T14:30:00.000Z"
}
```

---

## Break Sessions

### POST /sessions/break

Create a new break session from a completed work session's break bank.
Call when the user presses Start Break.

**Request body**:
```json
{
  "workSessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 201**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "workSessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "initialBankMs": 300000,
  "consumedMs": 0,
  "startedAt": "2026-05-08T15:56:00.000Z"
}
```

**Errors**:
- `404 Not Found` — `workSessionId` does not exist or is not in `stopped` status
- `409 Conflict` — `breakBankMs` on the work session is 0 (no break earned)
- `409 Conflict` — a break session already exists for this work session

---

### PATCH /sessions/break/:id

Update a break session (pause, resume, stop, or complete).

**Request body**:
```json
{
  "action": "pause" | "resume" | "stop" | "complete",
  "consumedMs": 180000
}
```

- `consumedMs`: Total break time consumed in ms (computed client-side).

**Response 200**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "completed" | "stopped_early" | "paused" | "running",
  "consumedMs": 300000,
  "endedAt": "2026-05-08T16:01:00.000Z"
}
```

**Errors**:
- `404 Not Found` — session ID does not exist
- `409 Conflict` — invalid state transition
- `422 Unprocessable Entity` — `consumedMs` exceeds `initialBankMs`

---

## Daily Statistics

### GET /stats/daily

Retrieve aggregated statistics for a calendar day.

**Query parameters**:
- `date` (required): ISO date string `YYYY-MM-DD`
- `timezone` (optional, default `UTC`): IANA timezone name (e.g., `America/New_York`)

**Response 200**:
```json
{
  "date": "2026-05-08",
  "totalWorkMs": 5400000,
  "totalBreakMs": 1080000,
  "workSessionCount": 3
}
```

**Errors**:
- `400 Bad Request` — `date` is missing, malformed, or in the future
- `400 Bad Request` — `timezone` is not a valid IANA timezone name

---

## Error Response Shape

All error responses follow this shape:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "durationMs cannot exceed wall-clock elapsed time"
}
```

---

## TypeScript Types (shared package)

Canonical types live in `shared/types/index.ts` and are imported by both
`frontend/src/services/api.ts` and `backend/src/routes/`.

```typescript
export type WorkStatus = 'running' | 'paused' | 'stopped';
export type BreakStatus = 'running' | 'paused' | 'completed' | 'stopped_early';
export type WorkAction = 'pause' | 'resume' | 'stop';
export type BreakAction = 'pause' | 'resume' | 'stop' | 'complete';

export interface WorkSession {
  id: string;
  status: WorkStatus;
  startedAt: string;          // ISO 8601
  endedAt: string | null;
  durationMs: number;
  pausedDurationMs: number;
  breakBankMs: number;
  createdAt: string;
}

export interface BreakSession {
  id: string;
  workSessionId: string;
  status: BreakStatus;
  initialBankMs: number;
  consumedMs: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

export interface DailyStats {
  date: string;               // YYYY-MM-DD
  totalWorkMs: number;
  totalBreakMs: number;
  workSessionCount: number;
}
```
