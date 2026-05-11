---
description: "Task list for Custom Pomodoro Timer implementation"
---

# Tasks: Custom Pomodoro Timer

**Input**: Design documents from `specs/001-pomodoro-timer/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Unit and integration tests included in the Polish phase. Only add earlier if TDD is explicitly requested.

**Organization**: Tasks grouped by user story to enable independent implementation and delivery.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no cross-task dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the pnpm monorepo, configure tooling, and create the Docker environment.

- [x] T001 Initialize pnpm monorepo: create `pnpm-workspace.yaml` referencing `frontend`, `backend`, `shared` packages and root `package.json` with workspace scripts
- [x] T002 [P] Initialize frontend package: `frontend/package.json` with React 18, Vite 5, TypeScript 5.4, Tailwind CSS 3, Zustand, Lucide React; `frontend/tsconfig.json`; `frontend/vite.config.ts`
- [x] T003 [P] Initialize backend package: `backend/package.json` with Fastify 4, Drizzle ORM, `@fastify/cors`, `@fastify/type-provider-typebox`, dotenv; `backend/tsconfig.json`
- [x] T004 [P] Initialize shared types package: `shared/package.json`; export WorkSession, BreakSession, DailyStats, WorkStatus, BreakStatus, WorkAction, BreakAction types in `shared/types/index.ts` (per contracts/api.md)
- [x] T005 [P] Configure ESLint (TypeScript rules) and Prettier (single quotes, trailing commas) at monorepo root: `.eslintrc.cjs`, `.prettierrc`
- [x] T006 Create Docker Compose file for PostgreSQL 15: `docker/docker-compose.yml` with service `pomo-postgres`, env vars POSTGRES_DB=pomo_timer POSTGRES_USER=pomo_user POSTGRES_PASSWORD=pomo_pass, port 5432:5432, named volume `pomo_pgdata` (per quickstart.md)
- [x] T007 Configure Tailwind CSS with design token theme extension: `frontend/tailwind.config.ts` with custom colors (work-bg, break-bg, accent, surface) and `frontend/src/styles/tokens.css` with CSS custom properties for dark mode (`dark:` variant enabled via `darkMode: 'class'`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, Drizzle client, Fastify server bootstrap, and core client-side utilities that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Define Drizzle schema: `backend/src/db/schema.ts` — `work_status` enum (`running`, `paused`, `stopped`), `break_status` enum (`running`, `paused`, `completed`, `stopped_early`), `work_sessions` table (id UUID PK, started_at timestamptz, ended_at timestamptz nullable, duration_ms integer, paused_duration_ms integer default 0, break_bank_ms integer default 0, status work_status, created_at timestamptz default now()), `break_sessions` table (id UUID PK, work_session_id UUID FK→work_sessions.id, initial_bank_ms integer, consumed_ms integer default 0, status break_status, started_at timestamptz, ended_at timestamptz nullable, created_at timestamptz default now())
- [x] T009 Create Drizzle database client: `backend/src/db/client.ts` — reads `DATABASE_URL` from `process.env`, initialises Drizzle with postgres-js driver, max 5 connections
- [x] T010 Generate and apply initial database migration: run `drizzle-kit generate` to produce SQL in `backend/drizzle/`; add `db:migrate` script to `backend/package.json` running `drizzle-kit migrate`
- [x] T011 Bootstrap Fastify server: `backend/src/server.ts` — register `@fastify/cors` (origin `http://localhost:5173`), set TypeBox type provider, read PORT from env (default 3001), export `startServer` function
- [x] T012 [P] Implement break bank calculation utility: `frontend/src/utils/breakBank.ts` — `calculateBreakBank(workMs: number): number` using segment-based algorithm from research.md (SHORT_BLOCK_MS=25×60000, CYCLE_MS=100×60000; first 3 blocks per cycle earn 5 min each; 4th block earns 15 min; partial blocks proportional)
- [x] T013 [P] Implement Zustand timer store with localStorage persistence: `frontend/src/store/timerStore.ts` — TimerStore interface with mode, workSessionId, workStartTimestamp, totalWorkMs, totalPausedMs, breakBankMs, breakSessionId, breakStartTimestamp, totalBreakConsumedMs; all action signatures (startWork, pauseWork, resumeWork, stopWork, startBreak, pauseBreak, resumeBreak, stopBreak, onBreakComplete, reset)
- [x] T014 Create API service layer: `frontend/src/services/api.ts` — typed fetch wrappers for all endpoints in contracts/api.md (createWorkSession, updateWorkSession, createBreakSession, updateBreakSession, getDailyStats); reads base URL from `import.meta.env.VITE_API_BASE_URL`

**Checkpoint**: Foundation ready — all user story phases can now begin.

---

## Phase 3: User Story 1 — Start a Working Session (Priority: P1) 🎯 MVP

**Goal**: User can start the Working timer (count-up), pause/resume it, stop it, and see the calculated break bank displayed immediately.

**Independent Test**: Open the app → click Start → observe timer counting up → click Pause → verify timer freezes → click Resume → verify timer continues → click Stop → verify break bank time is displayed correctly for the session duration.

### Backend — User Story 1

- [x] T015 [P] [US1] Implement WorkSessionService DB operations: `backend/src/services/workSessionService.ts` — `createSession(): Promise<WorkSession>`, `updateSession(id, action, durationMs, pausedDurationMs): Promise<WorkSession>` (calls `calculateBreakBank` on stop), `getSession(id): Promise<WorkSession>`; import `calculateBreakBank` from a shared util or inline equivalent
- [x] T016 [P] [US1] Implement POST /api/sessions/work route: `backend/src/routes/workSessions.ts` — TypeBox request/reply schemas; calls WorkSessionService.createSession(); returns 201 with WorkSession; returns 409 if a session with status running or paused already exists
- [x] T017 [US1] Implement PATCH /api/sessions/work/:id route: append to `backend/src/routes/workSessions.ts` — accepts `{ action, durationMs, pausedDurationMs }`, validates action is valid for current status, calls WorkSessionService.updateSession(), returns 200; returns 404 if not found, 409 on invalid transition, 422 if durationMs negative
- [x] T018 [P] [US1] Implement GET /api/sessions/work/:id route: append to `backend/src/routes/workSessions.ts` — returns full WorkSession or 404
- [x] T019 [US1] Register all work session routes on Fastify server: `backend/src/server.ts` — import and register workSessions router with `/api` prefix

### Frontend — User Story 1

- [x] T020 [P] [US1] Implement useWorkTimer hook: `frontend/src/hooks/useWorkTimer.ts` — drift-corrected elapsed time using `Date.now() - workStartTimestamp - totalPausedMs`; exposes `elapsedMs`, `isRunning`, `isPaused`, `start()`, `pause()`, `resume()`, `stop()` → calls store actions and API service; updates store each tick via `setInterval(100ms)`
- [x] T021 [P] [US1] Create TimerDisplay component: `frontend/src/components/TimerDisplay.tsx` — formats milliseconds to HH:MM:SS; aria-live="polite" for screen reader announcements on state transitions; accepts `ms: number` and `mode: 'work' | 'break'` props
- [x] T022 [P] [US1] Create ModeTab component: `frontend/src/components/ModeTab.tsx` — two tabs (Working / Break); active tab highlighted with design token color; tab switches only when no timer is active or after explicit stop; keyboard focusable
- [x] T023 [US1] Create TimerControls component: `frontend/src/components/TimerControls.tsx` — renders Start button when idle, Pause+Stop when running, Resume+Stop when paused; all buttons keyboard-accessible with visible focus ring; disabled states styled per design tokens
- [x] T024 [US1] Create BreakBank component: `frontend/src/components/BreakBank.tsx` — displays "Break earned: MM:SS" after work session stops; hidden while timer is running or in idle state; shows "No break earned" when breakBankMs is 0
- [x] T025 [US1] Wire Working mode in App.tsx: `frontend/src/App.tsx` — render ModeTab, TimerDisplay (using useWorkTimer elapsedMs), TimerControls, BreakBank; connect store mode to background color token (work-bg vs break-bg); add `prefers-color-scheme` listener to toggle dark class on `<html>`
- [x] T026 [US1] Apply pomofocus.io layout with Tailwind: `frontend/src/App.tsx` and `frontend/src/styles/tokens.css` — centered layout, large timer font (Tailwind `text-8xl`), muted card background, subtle box shadow, smooth background-color transition between modes

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 — Take a Proportional Break (Priority: P2)

**Goal**: After stopping a work session, user can start the Break timer, which counts down from the banked break time. Pausing/stopping work correctly. Audible alert fires when countdown reaches zero.

**Independent Test**: Stop a 25-min work session → verify break bank shows 5 min → click Start Break → observe countdown from 5:00 → let it reach 0:00 → confirm alert fires and timer stops. Then: start a new work session while unused break bank exists → confirm bank resets.

### Backend — User Story 2

- [x] T027 [P] [US2] Implement BreakSessionService: `backend/src/services/breakSessionService.ts` — `createBreakSession(workSessionId): Promise<BreakSession>` (validates work session is stopped and breakBankMs > 0; returns 409 if breakBankMs = 0); `updateBreakSession(id, action, consumedMs): Promise<BreakSession>` (validates consumedMs ≤ initialBankMs)
- [x] T028 [P] [US2] Implement POST /api/sessions/break route: `backend/src/routes/breakSessions.ts` — TypeBox schemas; calls BreakSessionService.createBreakSession(); returns 201; returns 404/409 per contract
- [x] T029 [US2] Implement PATCH /api/sessions/break/:id route: append to `backend/src/routes/breakSessions.ts` — accepts `{ action, consumedMs }`; returns 200 with updated BreakSession; status transitions per data-model.md
- [x] T030 [US2] Register break session routes on Fastify server: `backend/src/server.ts`

### Frontend — User Story 2

- [x] T031 [P] [US2] Implement useBreakTimer hook: `frontend/src/hooks/useBreakTimer.ts` — drift-corrected countdown using `breakBankMs - (Date.now() - breakStartTimestamp - totalPausedMs)`; calls `onBreakComplete` when remaining ≤ 0; exposes `remainingMs`, `isRunning`, `isPaused`, `start()`, `pause()`, `resume()`, `stop()`; calls API service and store actions
- [x] T032 [P] [US2] Implement audio alert utility: `frontend/src/utils/audio.ts` — `playChime()` using Web Audio API (OscillatorNode, 440Hz sine, 0.5s); graceful fallback to `<audio>` element with short inline base64 WAV if AudioContext creation fails (autoplay policy)
- [x] T033 [US2] Wire Break mode in App.tsx: `frontend/src/App.tsx` — render TimerDisplay with useBreakTimer remainingMs when mode is 'break' or 'paused-break'; apply break-bg token to background; call `playChime()` on break complete
- [x] T034 [US2] Add Start Break button to TimerControls: `frontend/src/components/TimerControls.tsx` — visible only when mode is 'idle' and breakBankMs > 0; disabled (with tooltip "No break earned") when breakBankMs = 0; clicking dispatches startBreak store action
- [x] T035 [US2] Guard new work session start against existing break bank: `frontend/src/hooks/useWorkTimer.ts` — when `start()` is called and breakBankMs > 0, reset break bank to 0 in store and call `updateBreakSession` with `stopped_early` if a break session ID exists

**Checkpoint**: User Stories 1 and 2 both independently functional and testable.

---

## Phase 5: User Story 3 — Review Daily Progress (Priority: P3)

**Goal**: Stats panel shows total accumulated work time and total break time consumed today. Stats reset automatically at midnight.

**Independent Test**: Complete 2 work sessions and 1 break session → verify stats panel shows correct totals → simulate next day (advance system clock or call stats endpoint with next date) → verify totals read 0.

### Backend — User Story 3

- [x] T036 [US3] Implement StatsService: `backend/src/services/statsService.ts` — `getDailyStats(date: string, timezone: string): Promise<DailyStats>` — queries work_sessions for date range in given timezone; aggregates duration_ms; queries break_sessions for consumed_ms; returns DailyStats shape
- [x] T037 [US3] Implement GET /api/stats/daily route: `backend/src/routes/stats.ts` — TypeBox schemas; validates `date` (YYYY-MM-DD, not future), `timezone` (IANA, optional default UTC); calls StatsService; returns 200 or 400 per contract
- [x] T038 [US3] Register stats route on Fastify server: `backend/src/server.ts`

### Frontend — User Story 3

- [x] T039 [US3] Create DailyStats component: `frontend/src/components/DailyStats.tsx` — displays "Today: X hr Y min worked · X min break taken"; fetches GET /api/stats/daily on mount and after each session ends; formats ms to human-readable; handles 0-stats gracefully ("No sessions today")
- [x] T040 [US3] Implement midnight-reset detection: `frontend/src/components/DailyStats.tsx` — store last-seen date in localStorage; on component mount, if stored date ≠ today, reset and re-fetch stats
- [x] T041 [US3] Render DailyStats below timer in App.tsx: `frontend/src/App.tsx` — always visible; receives refetch trigger prop updated after stopWork and onBreakComplete

**Checkpoint**: All 3 user stories functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, keyboard shortcuts, tests, performance validation.

- [x] T042 [P] Implement keyboard shortcuts hook: `frontend/src/hooks/useKeyboardShortcuts.ts` — Spacebar → Start/Pause/Resume based on current mode; Escape → Stop; attach/detach via useEffect; does not fire when focus is inside an input
- [x] T043 [P] Add aria-live announcements for all timer state transitions: `frontend/src/components/TimerDisplay.tsx` — announce "Work timer started", "Work timer paused", "Work timer stopped — N minutes break earned", "Break timer started", "Break complete" via visually-hidden `aria-live="assertive"` region
- [x] T044 [P] Add all interactive focus/hover/active/disabled states to button styles: `frontend/src/styles/tokens.css` and `frontend/src/components/TimerControls.tsx` — use Tailwind `focus-visible:ring-2`, `hover:brightness-110`, `active:scale-95`, `disabled:opacity-50 disabled:cursor-not-allowed`
- [x] T045 [P] Write unit tests for break bank calculation: `frontend/tests/utils/breakBank.test.ts` — Vitest; cover 10 min, 25 min, 50 min, 75 min, 100 min, 110 min, 200 min, 0 min inputs; assert exact ms output
- [x] T046 [P] Write unit tests for useWorkTimer and useBreakTimer hooks: `frontend/tests/hooks/useWorkTimer.test.ts`, `frontend/tests/hooks/useBreakTimer.test.ts` — React Testing Library + Vitest; mock Date.now(); test start/pause/resume/stop state transitions and elapsed/remaining accuracy
- [x] T047 [P] Write backend integration tests for work/break session routes: `backend/tests/sessions.test.ts` — Vitest; spin up Fastify test instance with in-memory Drizzle (SQLite for tests); cover all happy paths and error cases from contracts/api.md
- [x] T048 Run Vite production build and bundle analysis: `pnpm --filter frontend build`; run `vite-bundle-visualizer`; confirm total gzipped JS ≤ 200 kB; document result in `specs/001-pomodoro-timer/plan.md` under Performance Goals
- [x] T049 Validate quickstart.md end-to-end: follow `specs/001-pomodoro-timer/quickstart.md` from step 1 to step 10 in a clean environment; fix any inaccuracies found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 completion — BLOCKS all user story phases
- **US1 (Phase 3)**: Requires Phase 2 — no dependency on US2 or US3
- **US2 (Phase 4)**: Requires Phase 2 — depends on Phase 3 (needs break bank from stopped WorkSession in store)
- **US3 (Phase 5)**: Requires Phase 2 — independent of US1 and US2 at the backend level; frontend component requires sessions to exist for meaningful display
- **Polish (Phase 6)**: Requires all desired user stories to be complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No story dependencies.
- **US2 (P2)**: Can start after Foundational. Depends on US1 store actions (breakBankMs) for the "Start Break" guard.
- **US3 (P3)**: Can start after Foundational. Fully independent backend; DailyStats component integrates with App.tsx after US1 sessions exist.

### Within Each Phase

- Backend route → service → register (sequential within story)
- Frontend hook → component → wire in App.tsx (sequential within story)
- Backend and frontend tasks within a story can proceed in parallel if staffed

### Parallel Opportunities

- All Phase 1 tasks marked [P] run in parallel after T001
- T008–T011 (DB schema/migration) must run sequentially; T012–T014 can run in parallel with each other
- Within US1: T015, T016, T018 [P] run in parallel; T021, T022, T023 [P] run in parallel
- Within US2: T027, T028 [P] run in parallel; T031, T032 [P] run in parallel
- Polish tasks T042–T047 all run in parallel

---

## Parallel Example: User Story 1

```
# Backend (can run in parallel):
Task T015: Implement WorkSessionService
Task T016: Implement POST /sessions/work route
Task T018: Implement GET /sessions/work/:id route

# Frontend (can run in parallel):
Task T020: useWorkTimer hook
Task T021: TimerDisplay component
Task T022: ModeTab component

# Then sequentially:
Task T017: PATCH route (depends on service from T015)
Task T023: TimerControls (depends on hook shape from T020)
Task T024: BreakBank component
Task T025: Wire App.tsx
Task T026: Apply Tailwind layout
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (T015–T026)
4. **STOP and VALIDATE**: Start timer, pause/resume, stop, verify break bank displayed
5. Demo: working count-up timer with break bank calculation

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US1 → count-up work timer with break bank → **demo-able MVP**
3. US2 → break countdown with audio alert → **full core loop demo-able**
4. US3 → daily stats panel → **complete feature demo**

### Parallel Team Strategy (2 developers)

1. Both complete Setup + Foundational together
2. Developer A: US1 Backend (T015–T019) || Developer B: US1 Frontend (T020–T026)
3. Developer A: US2 Backend (T027–T030) || Developer B: US2 Frontend (T031–T035)
4. Developer A: US3 Backend (T036–T038) || Developer B: US3 Frontend (T039–T041)
5. Both: Polish (T042–T049)

---

## Notes

- [P] tasks operate on different files with no incomplete-task dependencies
- [Story] label maps each task to the user story it enables for traceability
- Timer accuracy is critical: useWorkTimer and useBreakTimer MUST use wall-clock delta (research.md), not accumulated interval counts
- The break bank calculation in `frontend/src/utils/breakBank.ts` is the single source of truth — backend WorkSessionService imports or reimplements the same logic for server-side validation
- Commit after each task or logical group; stop at any checkpoint to validate independence
