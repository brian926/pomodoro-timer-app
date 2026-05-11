# Quickstart: Local Development Setup

**Branch**: `001-pomodoro-timer` | **Date**: 2026-05-08

This guide walks through setting up the local development environment using
Rancher Desktop for Docker and pnpm for the monorepo.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Rancher Desktop | 1.12+ | Docker-compatible container runtime |
| Node.js | 20 LTS | JavaScript runtime |
| pnpm | 9+ | Monorepo package manager |

---

## 1. Rancher Desktop — First-Time Setup

Rancher Desktop ships with `nerdctl` (containerd) and optionally the Docker CLI
(`dockerd` via Moby engine). This project uses the **Docker CLI path**.

1. Open Rancher Desktop → **Preferences → Container Engine**.
2. Select **dockerd (moby)** as the container engine.
3. Ensure **"Expose Docker socket"** is enabled (required for `docker-compose`).
4. Click **Apply & Restart**.

Verify Docker is available and switch to the correct context:

```powershell
# Check active context — Rancher Desktop exposes the "default" context
docker context list

# Switch to default (Rancher Desktop's docker_engine pipe)
docker context use default

# Confirm connection
docker version
docker compose version
```

> **Note**: If the active context is `desktop-linux` or `desktop-windows`, Docker CLI
> is pointing at Docker Desktop (which may not be running). Switch to `default` as shown
> above. If `docker` is not on `PATH`, Rancher Desktop adds it to
> `%APPDATA%\rancher-desktop\bin` — restart your terminal or add that path manually.

---

## 2. Start the PostgreSQL Container

The `docker/docker-compose.yml` file defines a PostgreSQL 15 service.

```powershell
# From the repository root:
docker compose -f docker/docker-compose.yml up -d
```

Verify the container is running:

```powershell
docker compose -f docker/docker-compose.yml ps
```

Expected output:
```
NAME            IMAGE          STATUS    PORTS
pomo-postgres   postgres:15    running   0.0.0.0:5432->5432/tcp
```

**Connection details** (for `backend/.env`):

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `pomo_timer` |
| User | `pomo_user` |
| Password | `pomo_pass` |
| DATABASE_URL | `postgresql://pomo_user:pomo_pass@localhost:5432/pomo_timer` |

---

## 3. docker-compose.yml Reference

File location: `docker/docker-compose.yml`

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    container_name: pomo-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: pomo_timer
      POSTGRES_USER: pomo_user
      POSTGRES_PASSWORD: pomo_pass
    ports:
      - "5432:5432"
    volumes:
      - pomo_pgdata:/var/lib/postgresql/data

volumes:
  pomo_pgdata:
```

---

## 4. Install Dependencies

```powershell
# From the repository root:
pnpm install
```

This installs all packages across `frontend/`, `backend/`, and `shared/`.

---

## 5. Configure Environment Variables

Create `backend/.env` (not committed):

```env
DATABASE_URL=postgresql://pomo_user:pomo_pass@localhost:5432/pomo_timer
PORT=3001
NODE_ENV=development
```

Create `frontend/.env` (not committed):

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## 6. Run Database Migrations

```powershell
pnpm --filter backend db:migrate
```

This applies all Drizzle migration files in `backend/drizzle/` to the running
PostgreSQL container.

Verify tables were created:

```powershell
docker exec -it pomo-postgres psql -U pomo_user -d pomo_timer -c "\dt"
```

---

## 7. Start Development Servers

Open two terminals:

**Terminal 1 — Backend**:
```powershell
pnpm --filter backend dev
```
Server starts at `http://localhost:3001`.

**Terminal 2 — Frontend**:
```powershell
pnpm --filter frontend dev
```
App opens at `http://localhost:5173`.

---

## 8. Stop the Database Container

```powershell
docker compose -f docker/docker-compose.yml stop
```

To remove the container and its data volume entirely:

```powershell
docker compose -f docker/docker-compose.yml down -v
```

> **Warning**: `-v` deletes the `pomo_pgdata` volume. All session history is lost.
> Omit `-v` to keep data between restarts.

---

## 9. Common Troubleshooting

### Port 5432 already in use

Another PostgreSQL instance is running locally. Either stop it or change the host
port mapping in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"   # use 5433 on host
```

Update `DATABASE_URL` accordingly: `...@localhost:5433/pomo_timer`.

### `docker: command not found`

Rancher Desktop's bin directory is not on `PATH`. In PowerShell:

```powershell
$env:PATH += ";$env:APPDATA\rancher-desktop\bin"
```

Add this to your PowerShell profile (`$PROFILE`) to persist across sessions.

### `nerdctl` vs `docker`

If Rancher Desktop is configured with containerd (not dockerd), replace `docker`
with `nerdctl` in all commands above. `docker-compose` is then `nerdctl compose`.

### Database migration fails

Ensure the container is running (`docker compose ps`) before running migrations.
If the `pomo_timer` database does not exist, the container may not have finished
initializing — wait a few seconds and retry.

---

## 10. Running Tests

```powershell
# Unit tests (Vitest):
pnpm --filter frontend test
pnpm --filter backend test

# All tests:
pnpm test

# E2E tests (Playwright — requires both servers running):
pnpm --filter frontend test:e2e
```
