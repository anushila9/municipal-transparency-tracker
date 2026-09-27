# Starting Pariyojana Tracker

One script starts everything: PostgreSQL, the Spring Boot backend and the React frontend. It waits until each one is ready, then opens the site in your browser. Press **Ctrl+C** in the same terminal to stop the backend and frontend.

## Before the first run (one time only)

You need:

- **Java 25**: check with `java -version`
- **Node.js 24 or newer**: check with `node -v`
- **PostgreSQL 16** from Homebrew, with the database created:

  ```sh
  brew install postgresql@16 && brew services start postgresql@16
  /opt/homebrew/opt/postgresql@16/bin/psql postgres -c "CREATE ROLE egov WITH LOGIN PASSWORD 'egov';" -c "CREATE DATABASE egov_tracker OWNER egov;"
  ```

- **`backend/.env`** with your secrets (it is gitignored):

  ```sh
  cd backend && cp .env.example .env
  openssl rand -base64 48   # paste the output as JWT_SECRET in .env, and set DB_PASSWORD
  ```

## The script

Save this as `start.sh` in the project root (the folder that contains `backend/` and `frontend/`), then make it executable once:

```sh
chmod +x start.sh
```

```bash
#!/usr/bin/env bash
# Starts PostgreSQL, the backend (port 8080) and the frontend (port 5173), then opens the site.
# Ctrl+C stops the backend and frontend. PostgreSQL keeps running as a Homebrew service.
set -euo pipefail
set -m  # run each server in its own process group, so Ctrl+C stops the whole tree (including Java)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PG_BIN="/opt/homebrew/opt/postgresql@16/bin"
TMP_BASE="${TMPDIR:-/tmp}"
LOG_DIR="${TMP_BASE%/}/pariyojana-logs"
BACKEND_URL="http://localhost:8080/api/meta"
FRONTEND_URL="http://localhost:5173"
mkdir -p "$LOG_DIR"

PIDS=()
cleanup() {
  trap - INT TERM EXIT
  if ((${#PIDS[@]})); then
    echo
    echo "Stopping servers..."
    for pid in "${PIDS[@]}"; do kill -- "-$pid" 2>/dev/null || true; done
    wait 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

is_up() { curl -s -o /dev/null --max-time 2 "$1"; }

# Waits up to $3 seconds for URL $1; fails early if process $2 exits.
wait_for() {
  local url=$1 pid=$2 timeout=$3 name=$4 log=$5
  for ((i = 0; i < timeout; i++)); do
    is_up "$url" && return 0
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "✗ $name stopped while starting. Last lines of $log:"
      tail -n 25 "$log"
      exit 1
    fi
    sleep 1
  done
  echo "✗ $name did not start within ${timeout}s. See $log"
  exit 1
}

# 1. PostgreSQL
if ! "$PG_BIN/pg_isready" -q -h localhost -p 5432; then
  echo "• Starting PostgreSQL..."
  brew services start postgresql@16 >/dev/null
  for ((i = 0; i < 30; i++)); do "$PG_BIN/pg_isready" -q -h localhost -p 5432 && break; sleep 1; done
  "$PG_BIN/pg_isready" -q -h localhost -p 5432 || { echo "✗ PostgreSQL did not start."; exit 1; }
fi
echo "✓ PostgreSQL is running"

# 2. Backend
if [[ ! -f "$ROOT/backend/.env" ]]; then
  echo "✗ backend/.env is missing. Copy backend/.env.example to backend/.env and fill in DB_PASSWORD and JWT_SECRET."
  exit 1
fi
if is_up "$BACKEND_URL"; then
  echo "✓ Backend already running on port 8080"
else
  echo "• Starting backend (the first run downloads dependencies and can take a few minutes)..."
  (cd "$ROOT/backend" && exec ./mvnw -q spring-boot:run) >"$LOG_DIR/backend.log" 2>&1 &
  PIDS+=($!)
  wait_for "$BACKEND_URL" "$!" 300 "Backend" "$LOG_DIR/backend.log"
  echo "✓ Backend is running on port 8080"
fi

# 3. Frontend
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "• Installing frontend dependencies..."
  (cd "$ROOT/frontend" && npm install --no-fund --no-audit)
fi
if is_up "$FRONTEND_URL"; then
  echo "✓ Frontend already running on port 5173"
else
  echo "• Starting frontend..."
  (cd "$ROOT/frontend" && exec npx vite --port 5173 --strictPort) >"$LOG_DIR/frontend.log" 2>&1 &
  PIDS+=($!)
  wait_for "$FRONTEND_URL" "$!" 60 "Frontend" "$LOG_DIR/frontend.log"
  echo "✓ Frontend is running on port 5173"
fi

echo
echo "Pariyojana Tracker is ready:"
echo "  Public site:  $FRONTEND_URL"
echo "  Admin panel:  $FRONTEND_URL/admin   (admin@tracker.local)"
echo "  Logs:         $LOG_DIR"
open "$FRONTEND_URL" 2>/dev/null || true

if ((${#PIDS[@]})); then
  echo
  echo "Press Ctrl+C to stop the servers."
  wait
else
  trap - INT TERM EXIT  # nothing was started by this script, so nothing to stop
fi
```

## Running it

```sh
./start.sh
```

You will see a line for each part as it becomes ready, and the site opens in your browser:

```
✓ PostgreSQL is running
• Starting backend (the first run downloads dependencies and can take a few minutes)...
✓ Backend is running on port 8080
• Starting frontend...
✓ Frontend is running on port 5173

Pariyojana Tracker is ready:
  Public site:  http://localhost:5173
  Admin panel:  http://localhost:5173/admin   (admin@tracker.local)
```

If the backend or frontend is already running, the script leaves it alone and only starts what is missing.

## Stopping

- **Backend and frontend:** press **Ctrl+C** in the terminal running the script.
- **PostgreSQL** (optional, it uses little memory): `brew services stop postgresql@16`

## Admin login

Email: `admin@tracker.local`. The password is the one you set for the admin account. It is not stored in this file on purpose.

## If something goes wrong

| Problem | What to do |
|---|---|
| `backend/.env is missing` | Follow the one-time setup above. |
| `Backend stopped while starting` | Read the log lines the script prints. A missing `JWT_SECRET`, a wrong `DB_PASSWORD`, or a missing `egov_tracker` database are the usual causes. |
| `Port 5173 is in use` in the frontend log | Another app is using the port. Stop it, or find it with `lsof -i :5173`. |
| Port 8080 is used by something else | Find it with `lsof -i :8080` and stop it. |
| The page loads but shows "Could not reach the server" | The backend is not running. Check `backend.log` in the logs folder. |
