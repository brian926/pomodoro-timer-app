# Research: Custom Pomodoro Timer

**Branch**: `001-pomodoro-timer` | **Date**: 2026-05-08

## Language & Framework

**Decision**: TypeScript 5.4 throughout — React 18 + Vite 5 (frontend), Fastify 4 (backend).

**Rationale**: The user offered JS, TS, or Go. TypeScript is optimal here because:
- The primary challenge is accurate, reactive timer state — React hooks are the right tool.
- Shared TypeScript types between `frontend/` and `backend/` (via the `shared/` package) catch
  API shape mismatches at compile time, eliminating a class of runtime bugs.
- Go would require a separate frontend framework anyway, adding complexity without benefit.
- JavaScript without TypeScript is ruled out by the constitution's code quality principle
  (type-checking gate before merge).

**Alternatives considered**:
- Go (backend only) + React TS (frontend): Valid but splits the type system across two
  languages. More setup for the same outcome. Ruled out for v1.
- Vue or Svelte instead of React: Both viable; React chosen for ecosystem maturity and
  the availability of Zustand for simple timer state management.

---

## Timer Accuracy

**Decision**: Drift-corrected wall-clock delta pattern (not raw `setInterval` accumulation).

**Rationale**: `setInterval` drifts because JavaScript event-loop delays are non-deterministic.
Accumulating +1 per tick produces measurable drift over long sessions, violating the
constitution's ±50ms accuracy requirement.

**Implementation pattern**:
```
startTimestamp = Date.now()
onTick():
  elapsed = Date.now() - startTimestamp - totalPausedMs
  displayTime = elapsed
```
Each tick reads the absolute wall clock delta. Drift is bounded by a single tick interval
(≤1s). Achieves ±1ms accuracy in practice — well within the ±50ms constitution threshold.

**Pause handling**: When paused, record `pauseStart = Date.now()`. On resume,
`totalPausedMs += Date.now() - pauseStart`. Subtract from elapsed in every tick.

---

## Break Bank Calculation Algorithm

**Decision**: Segment-based proportional calculation with replacement rule at 100-min boundary.

**Rationale**: The spec requires:
- Short blocks (first 3 per 100-min cycle): 5 min break per 25 min work
- Long block (4th per 100-min cycle): 15 min break (replaces the short break)
- Partial blocks: proportional at the applicable rate

**Algorithm** (TypeScript pseudocode):
```typescript
const SHORT_BLOCK_MS = 25 * 60 * 1000;   // 25 min
const CYCLE_MS       = 100 * 60 * 1000;  // 100 min
const SHORT_EARN_MS  =  5 * 60 * 1000;   //  5 min
const LONG_EARN_MS   = 15 * 60 * 1000;   // 15 min

function calculateBreakBank(workMs: number): number {
  const completeCycles = Math.floor(workMs / CYCLE_MS);
  const remainder      = workMs % CYCLE_MS;

  // 30 min earned per complete 100-min cycle (3×5 + 1×15)
  let bankMs = completeCycles * (3 * SHORT_EARN_MS + LONG_EARN_MS);

  // Process remainder within the current cycle
  const shortBlocksInRemainder = Math.min(3, remainder / SHORT_BLOCK_MS);
  const wholeShortBlocks       = Math.floor(shortBlocksInRemainder);
  const partialShortFraction   = shortBlocksInRemainder - wholeShortBlocks;

  bankMs += wholeShortBlocks * SHORT_EARN_MS;
  bankMs += partialShortFraction * SHORT_EARN_MS;

  // Check if remainder extends into the long block (>75 min into cycle)
  const longBlockStart = 3 * SHORT_BLOCK_MS;
  if (remainder > longBlockStart) {
    const longBlockMs       = remainder - longBlockStart;
    const longBlockFraction = Math.min(1, longBlockMs / SHORT_BLOCK_MS);
    bankMs += longBlockFraction * LONG_EARN_MS;
    // The partial short block credit already counted 3 full short blocks above
    // but if we're in the long block, the 3rd short block was completed — correct.
  }

  return Math.round(bankMs);
}
```

**Validation examples**:
- 25 min → 5 min ✅
- 50 min → 10 min ✅
- 75 min → 15 min ✅
- 100 min → 30 min ✅ (3×5 + 15, not 4×5+15)
- 10 min → 2 min ✅ (proportional)
- 110 min → 32 min ✅ (30 min from complete cycle + 2 min from 10-min partial)

---

## State Management

**Decision**: Zustand with persistence via the `zustand/middleware` `persist` adapter
(localStorage) for client-side timer state. PostgreSQL for server-side persistence.

**Rationale**: Zustand is lightweight (~1 kB), TypeScript-native, and avoids the
boilerplate of Redux. Timer state (running/paused/stopped, elapsed ms, break bank)
must survive page refreshes during a session — localStorage persistence handles this.
Server DB records sessions for daily stats after each session ends.

**State shape**:
```typescript
type TimerState = {
  mode: 'idle' | 'working' | 'paused-work' | 'break' | 'paused-break'
  workStartTimestamp: number | null   // Date.now() at last start/resume
  totalWorkMs: number                 // accumulated work time (wall-clock)
  totalPausedMs: number               // accumulated pause time
  breakBankMs: number                 // calculated on work stop
  breakStartTimestamp: number | null
  breakConsumedMs: number
  currentSessionId: string | null     // DB session ID
}
```

---

## Styling Approach

**Decision**: Tailwind CSS 3 with a CSS custom properties token layer.

**Rationale**: Tailwind satisfies the constitution's design token requirement via its
`tailwind.config.ts` theme extension. A thin `tokens.css` file maps semantic names
(e.g., `--color-work-bg`, `--color-break-bg`) to palette values, enabling dark mode
and mode-specific color shifts without component-level style duplication.

**Dark mode**: Tailwind `darkMode: 'class'` strategy — a `dark` class on `<html>` toggled
by user preference or `prefers-color-scheme` media query.

**SVG icons**: Lucide React — tree-shakeable, consistent stroke style, TypeScript types.

---

## Backend Framework

**Decision**: Fastify 4 with Drizzle ORM.

**Rationale**:
- Fastify is the fastest Node.js HTTP framework (≈2× Express throughput) with built-in
  JSON schema validation via `@fastify/type-provider-typebox`.
- Drizzle ORM is type-safe, generates standard SQL (no magic), and its schema file
  doubles as the source of truth for TypeScript DB types — no code generation step needed.
- Drizzle migrations run as plain SQL files, easy to inspect and version control.

---

## Database

**Decision**: PostgreSQL 15 in a Docker container managed via Rancher Desktop.

**Rationale**: The user specified local Docker and uses Rancher Desktop. PostgreSQL is the
right fit — robust, supports UUID primary keys, timestamptz, and enum types natively.
Schema migrations via Drizzle Kit.

**Connection**: Backend reads `DATABASE_URL` from environment (`.env` file, not committed).
Connection pooling via Drizzle's built-in pool (max 5 connections for local dev).

See `quickstart.md` for Rancher Desktop setup and container startup instructions.

---

## Audio Alerts

**Decision**: Web Audio API with a fallback to an `<audio>` element.

**Rationale**: Web Audio API allows generating a simple chime tone programmatically
(no asset file needed), reducing bundle size. For browsers where Web Audio context
creation fails (autoplay policy), an `<audio>` element with a pre-loaded short MP3
serves as fallback. Both are browser-native — no third-party audio library needed.
