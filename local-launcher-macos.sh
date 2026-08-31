#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
VITE_CLI="$PROJECT_ROOT/node_modules/vite/bin/vite.js"
URL="http://127.0.0.1:41735"
HEALTH_URL="$URL/api/health"
if [[ ! -f "$VITE_CLI" ]]; then
  echo "Project dependencies are missing. Run npm install in the project folder first."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required."
  exit 1
fi

if ! curl --silent --fail --max-time 1 "$HEALTH_URL" >/dev/null; then
  nohup node "$VITE_CLI" --config local-vite.config.ts --host 127.0.0.1 --port 41735 \
    >"${TMPDIR:-/tmp}/ai-motion-workbench-vite.log" 2>&1 &

  ready=0
  for _ in {1..60}; do
    sleep 0.5
    if curl --silent --fail --max-time 1 "$HEALTH_URL" >/dev/null; then
      ready=1
      break
    fi
  done

  if [[ "$ready" != "1" ]]; then
    echo "The local service did not start. See ${TMPDIR:-/tmp}/ai-motion-workbench-vite.log"
    exit 1
  fi
fi

open "$URL"
