#!/usr/bin/env bash
set -euo pipefail

# Simple background server launcher for this project.
# Serves the current folder (including index.html) on all interfaces.

PORT="${PORT:-5173}"
HOST="${HOST:-0.0.0.0}"
PID_FILE=".server.pid"
LOG_FILE="http.log"

find_listener_pid() {
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  fi
  printf '%s' "$pid"
}

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Server already running (PID $OLD_PID)."
    echo "Open: http://localhost:$PORT"
    echo "From another machine: http://<your-computer-ip>:$PORT"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

EXISTING_PID="$(find_listener_pid)"
if [[ -n "${EXISTING_PID}" ]]; then
  echo "Port $PORT is already in use by PID $EXISTING_PID."
  echo "Stop the existing server or run with a different port, for example:"
  echo "  PORT=5174 ./start_server.sh"
  if [[ -f "$LOG_FILE" ]]; then
    echo "Last server log:"
    tail -n 5 "$LOG_FILE" 2>/dev/null || true
  fi
  exit 1
fi

echo "Starting server on $HOST:$PORT ..."
nohup python3 -m http.server "$PORT" --bind "$HOST" >"$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" >"$PID_FILE"

sleep 0.4
if kill -0 "$NEW_PID" 2>/dev/null; then
  echo "Server started (PID $NEW_PID)."
  echo "Local:   http://localhost:$PORT"
  echo "Network: http://<your-computer-ip>:$PORT"
  echo "Logs:    $LOG_FILE"
else
  echo "Server failed to start. Check $LOG_FILE for details."
  rm -f "$PID_FILE"
  exit 1
fi
