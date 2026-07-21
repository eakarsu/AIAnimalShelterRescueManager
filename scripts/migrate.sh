#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test -n "${DATABASE_URL:-}" || { echo 'DATABASE_URL is required.' >&2; exit 1; }
for migration in "$root"/backend/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done
