#!/usr/bin/env bash
# Quick start: local Wuz + Next scanner on :3002
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH"

MODE="${1:-local}"

if [[ "$MODE" == "live" ]]; then
  node scripts/use-env.js live
  echo "Starting UI against LIVE Wuz..."
  npm run dev
elif [[ "$MODE" == "local" ]]; then
  node scripts/use-env.js local
  docker compose up -d wuzapi-db wuzapi
  # ensure user token exists
  curl -sS -X POST "http://127.0.0.1:8082/admin/users" \
    -H "Authorization: admin_himmat6376721036" \
    -H "Content-Type: application/json" \
    --data '{"name":"whatsapp_scan_show","token":"himmat6376721036","events":"Message,ReadReceipt"}' \
    >/dev/null 2>&1 || true
  echo "Starting UI against LOCAL Wuz (:8082)..."
  npm run dev
else
  echo "Usage: ./run.sh local|live"
  exit 1
fi
