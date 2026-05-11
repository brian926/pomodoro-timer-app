# Implementation Plan: Custom Pomodoro Timer

**Branch**: `001-pomodoro-timer` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-pomodoro-timer/spec.md`

## Summary

A web-based Pomodoro timer where the user manually controls all transitions. The Working
timer counts up indefinitely; stopping it triggers a break bank calculation using a
replacement rule (every 25 min = +5 min break; the 4th block per 100-min cycle earns
15 min instead of 5 min; partial blocks earn proportional credit). A separate Break
countdown timer then consumes that bank. Sessions and daily statistics are persisted to
a local PostgreSQL database. The UI mirrors pomofocus.io's minimal, centered layout with
tab-style mode switching and background color shifts.

**Stack**: TypeScript monorepo — React 18 + Vite (frontend), Fastify (backend), PostgreSQL 15 (Docker).

## Technical Context

**Language/Version**: TypeScript 5.4 (frontend + backend); Node.js 20 LTS  
**Primary Dependencies**: React 18, Vite 5, Fastify 4, Drizzle ORM, Zustand, Tailwind CSS 3, Lucide React  
**Storage**: PostgreSQL 15 (local Docker container via Rancher Desktop)  
**Testing**: Vitest (unit + integration), React Testing Library, Playwright (E2E)  
**Target Platform**: Modern desktop and mobile browsers (Chrome 120+, Firefox 120+, Safari 17+)  
**Project Type**: Web application (React SPA + REST API backend)  
**Performance Goals**: LCP ≤1.5s, timer accuracy ±50ms, CLS ≤0.1, bundle <200 kB gzipped  
**Constraints**: Browser-only audio (Web Audio API), local Docker for DB, offline timer operation (timer runs client-side; DB calls are non-blocking)  
**Scale/Scope**: Single-user local development app; no auth required for v1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Code Quality | TypeScript strict mode enabled; ESLint + Prettier configured; all timer logic unit-tested | ✅ PASS | Monorepo enforces shared type discipline |
| II. UI & Experience | All controls keyboard-navigable; WCAG 2.1 AA contrast; visual feedback ≤100ms via React state | ✅ PASS | React's synchronous state update guarantees sub-100ms feedback |
| III. Modern Design | Tailwind design tokens for all styling; dark mode from day 1; Lucide SVG icons; no inline styles | ✅ PASS | Tailwind's `dark:` variant covers dark mode systematically |
| IV. Performance | Vite tree-shaking; drift-corrected timer (wall-clock delta, not cumulative interval); bundle tracking via `vite-bundle-visualizer` | ✅ PASS | Drift correction keeps timer within ±1ms over long sessions |

**Post-Phase-1 re-check**: All gates still pass. REST API adds ≈2 kB to client (fetch calls only). Database calls are fire-and-forget on session stop/start; they do not block the timer UI.

## Project Structure

### Documentation (this feature)

```text
specs/001-pomodoro-timer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (Docker/Rancher guide)
├── contracts/
│   └── api.md           # Phase 1 output (REST API contract)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   ├── ModeTab.tsx
│   │   ├── BreakBank.tsx
│   │   └── DailyStats.tsx
│   ├── hooks/
│   │   ├── useWorkTimer.ts
│   │   └── useBreakTimer.ts
│   ├── store/
│   │   └── timerStore.ts
│   ├── services/
│   │   └── api.ts
│   ├── utils/
│   │   └── breakBank.ts
│   ├── styles/
│   │   └── tokens.css
│   └── App.tsx
└── tests/

backend/
├── src/
│   ├── routes/
│   │   ├── workSessions.ts
│   │   ├── breakSessions.ts
│   │   └── stats.ts
│   ├── services/
│   │   ├── workSessionService.ts
│   │   └── breakSessionService.ts
│   ├── db/
│   │   ├── schema.ts
│   │   └── client.ts
│   └── server.ts
└── tests/

shared/
└── types/
    └── index.ts

docker/
└── docker-compose.yml

pnpm-workspace.yaml
package.json
```

**Structure Decision**: Web application (Option 2 variant) — separate `frontend/` and `backend/` packages in a pnpm monorepo, with a `shared/` package for TypeScript types. This enables type safety across the API boundary without duplication.

## Complexity Tracking

> No constitution violations — table omitted per plan guidelines.
