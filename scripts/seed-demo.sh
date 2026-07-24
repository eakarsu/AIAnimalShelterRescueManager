#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if test -f "$root/.env"; then set -a; source "$root/.env"; set +a; fi
case "${CONFIRM_DEMO_SEED:-}" in yes|YES) ;; *) echo 'Set CONFIRM_DEMO_SEED=yes to seed demo data.' >&2; exit 1 ;; esac
(cd "$root/backend" && npm run seed)
