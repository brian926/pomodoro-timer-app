# Pomodoro Timer App

A web-based Pomodoro timer where you control all transitions manually. Sign in with your Google account — each user's work sessions, break sessions, and daily stats are stored and scoped to their account. The Work timer counts up indefinitely — stopping it calculates your earned break time using a proportional rule. A dedicated Break countdown then consumes that banked time.

**Break bank formula:**
- Every 25 min worked → +5 min break
- Every 100 min worked → the 4th block earns 15 min instead of 5 min (long break)
- Partial blocks earn proportional credit

UI is inspired by [pomofocus.io](https://pomofocus.io) — minimal, centered layout with tab-style mode switching.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS, Zustand |
| Backend | Fastify 5, Drizzle ORM |
| Database | PostgreSQL 15 (Docker) |
| Language | TypeScript 5.4 (monorepo via pnpm) |

## Prerequisites

- [Node.js](https://nodejs.org/) 20 LTS
- [pnpm](https://pnpm.io/) 9+
- [Rancher Desktop](https://rancherdesktop.io/) 1.12+ (or Docker Desktop) with **dockerd (moby)** engine enabled

## Setup

### 1. Start the database

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create `backend/.env` (see `backend/.env.example` for all keys):
```env
DATABASE_URL=postgresql://pomo_user:pomo_pass@localhost:5432/pomo_timer
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Google OAuth — create credentials at console.cloud.google.com
# Authorized redirect URI: http://localhost:3001/api/auth/google/callback
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-64-char-hex-string
```

### 4. Run database migrations

```bash
pnpm --filter backend db:migrate
```

### 5. Start development servers

In two separate terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
pnpm --filter backend dev

# Terminal 2 — frontend (http://localhost:5173)
pnpm --filter frontend dev
```

## Running Tests

```bash
# Unit tests
pnpm --filter frontend test
pnpm --filter backend test

# All tests
pnpm test

# E2E tests (requires both servers running)
pnpm --filter frontend test:e2e
```

## Stopping the Database

```bash
# Stop container (preserves data)
docker compose -f docker/docker-compose.yml stop

# Remove container and data volume
docker compose -f docker/docker-compose.yml down -v
```

> **Warning:** `-v` permanently deletes all session history.

## Troubleshooting

**Port 5432 already in use** — Another PostgreSQL instance is running. Change the host port in `docker-compose.yml` to `5433:5432` and update `DATABASE_URL` accordingly.

**`docker: command not found`** — Add Rancher Desktop's bin directory to your PATH:
```powershell
$env:PATH += ";$env:APPDATA\rancher-desktop\bin"
```

**Migration fails** — Ensure the container is fully running (`docker compose ps`) before running migrations. Wait a few seconds after startup and retry.
