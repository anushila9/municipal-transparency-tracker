# Pariyojana Tracker

Municipal Budget & Development Project Transparency Tracker. See `CLAUDE.md` for the full spec.

```
backend/   Spring Boot 4.1 (Java 25) · PostgreSQL 16 · Flyway · Spring Security + JWT
frontend/  React 19 · Vite · Tailwind CSS 4 · React Router
```

## Running locally

**1. Database** (one-time setup):

```sh
brew install postgresql@16 && brew services start postgresql@16
psql postgres -c "CREATE ROLE egov WITH LOGIN PASSWORD 'egov';" -c "CREATE DATABASE egov_tracker OWNER egov;"
```

**2. Backend secrets** (one-time setup). Copy the example file and fill in `DB_PASSWORD` and `JWT_SECRET`. `backend/.env` is gitignored; never commit it:

```sh
cd backend && cp .env.example .env
openssl rand -base64 48   # paste the output as JWT_SECRET
```

The backend refuses to start if `JWT_SECRET` is missing, rather than falling back to a known value. `DB_PASSWORD` has no default either; a local Homebrew PostgreSQL may accept connections without checking it, but any password-protected database will reject the app until it's set.

**3. Backend** on http://localhost:8080. Flyway creates the schema, and the seed data loads on first start:

```sh
cd backend && ./mvnw spring-boot:run
```

**4. Frontend** on http://localhost:5173. `/api` is proxied to the backend:

```sh
cd frontend && npm install && npm run dev
```

Seeded admin login: `admin@tracker.local`. Its password is `SEED_ADMIN_PASSWORD` from `.env` if you set one; otherwise a random password is generated and printed once in the backend log (`Generated admin password…`) the first time the database is seeded.

To reset the seed data: `psql postgres -c "DROP DATABASE egov_tracker;" -c "CREATE DATABASE egov_tracker OWNER egov;"`, then restart the backend.

## API (so far)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/projects?ward=&sector=&status=&fiscalYear=&q=&sort=&page=&size=` | public | Filtered, paged project list |
| GET | `/api/projects/{id}` | public | Project detail and status history |
| GET | `/api/meta` | public | Filter options and labels |
| POST | `/api/auth/login` | public | `{email, password}` → JWT |
| GET | `/api/stats?fiscalYear=` | public | Dashboard totals, status and sector breakdown |
| GET | `/api/admin/me` | admin JWT | Current admin profile |
| POST | `/api/admin/projects` | admin JWT | Create a project (writes the first StatusHistory entry) |
| PUT | `/api/admin/projects/{id}` | admin JWT | Update a project; each changed field goes to AuditLog, a changed status goes to StatusHistory |
| POST | `/api/admin/projects/{id}/status` | admin JWT | `{status, note}` → records a status change |
| DELETE | `/api/admin/projects/{id}` | admin JWT | Delete a project (the deletion is kept in AuditLog) |
| GET | `/api/admin/reports?state=ALL\|OPEN\|RESPONDED&projectId=&page=&size=` | admin JWT | Citizen reports inbox |
| GET | `/api/admin/reports/counts` | admin JWT | Open / responded totals |
| PUT | `/api/admin/reports/{id}/response` | admin JWT | `{response}` → add or edit the official response |
| GET | `/api/admin/audit?entityType=&entityId=&page=&size=` | admin JWT | Read-only audit trail, newest first |

`sort` accepts `RECENT` (default), `BUDGET_DESC`, `BUDGET_ASC` or `TITLE`. Errors are returned as RFC 9457 `application/problem+json`; validation failures add an `errors` map of field → message.

## Environment variables (backend)

Set these as real environment variables, or in `backend/.env` (see `backend/.env.example`).

- **Required:** `DB_PASSWORD`, `JWT_SECRET` (at least 32 bytes)
- **Optional:** `SEED_ADMIN_PASSWORD`, `DB_URL`, `DB_USER`, `CORS_ORIGINS`, `SEED_ENABLED`
