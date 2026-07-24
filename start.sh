#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$root/.env" || { echo 'Missing .env; copy .env.example and configure it.' >&2; exit 1; }
test -d "$root/backend/node_modules" && test -d "$root/frontend/node_modules" || { echo 'Dependencies missing; run scripts/bootstrap.sh.' >&2; exit 1; }
set -a; source "$root/.env"; set +a
: "${BACKEND_PORT:=3001}" "${FRONTEND_PORT:=5173}"
[[ "$BACKEND_PORT" =~ ^[0-9]+$ && "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || { echo 'Backend and frontend ports must be numeric.' >&2; exit 2; }
test "$BACKEND_PORT" != "$FRONTEND_PORT" || { echo 'Backend and frontend ports must be different.' >&2; exit 2; }
for assigned_port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -tiTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Assigned port $assigned_port is already in use; no process was stopped." >&2
    exit 1
  fi
done
(cd "$root/backend" && npm start) & backend_pid=$!
(cd "$root/frontend" && npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT") & frontend_pid=$!
cleanup() { kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
