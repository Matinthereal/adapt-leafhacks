#!/usr/bin/env bash
# Adapt — desktop assistant launcher.
#   ./desktop/adapt-assistant.sh            → compact on-screen assistant window
#   ./desktop/adapt-assistant.sh --full     → full app window
# Starts the local server if it isn't already running, then opens a native-feel
# app window (Chrome/Chromium --app mode: no tabs, no URL bar, own dock icon).
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"

# 1. server up?
if ! curl -sf -m 2 "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
  echo "Starting Adapt server…"
  (cd "$DIR" && nohup node server.js >/tmp/adapt-server.log 2>&1 &)
  for i in $(seq 1 20); do
    curl -sf -m 1 "http://localhost:${PORT}/api/health" >/dev/null 2>&1 && break
    sleep 0.3
  done
fi

# 2. find a chromium-family browser
BROWSER=""
for c in google-chrome-stable google-chrome chromium-browser chromium microsoft-edge brave-browser; do
  command -v "$c" >/dev/null 2>&1 && BROWSER="$c" && break
done

URL="http://localhost:${PORT}/?app=1"
if [ "$1" = "--full" ]; then
  SIZE="1200,800"
else
  SIZE="440,780"   # compact assistant
fi

if [ -n "$BROWSER" ]; then
  exec "$BROWSER" --app="$URL" --window-size="$SIZE" \
    --user-data-dir="${HOME}/.config/adapt-assistant" --no-first-run --no-default-browser-check
else
  # fallback: any default browser (regular tab)
  xdg-open "$URL"
fi
