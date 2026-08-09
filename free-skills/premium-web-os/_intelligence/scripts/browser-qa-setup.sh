#!/usr/bin/env bash
# Browser-QA setup — install the gstack /browse daemon, adapted for locked-Chromium sandboxes.
#
# Normal dev machine: delegates to gstack's own ./setup (which downloads Chromium via Bun).
# Locked sandbox (Claude Code web / CI image with a preinstalled browser + no-download policy):
#   pins Playwright to the version matching the preinstalled Chromium build and skips the
#   download, so gstack's launch probe passes with zero download.
#
# Usage:
#   GSTACK_DIR=/path/to/.claude/skills/gstack ./browser-qa-setup.sh [--host claude|codex|auto]
# Env:
#   GSTACK_DIR                path to a gstack checkout (required)
#   GSTACK_PLAYWRIGHT_VERSION override the pinned Playwright version (default: the global
#                             `playwright` version, else leave gstack's pin as-is)
#   PLAYWRIGHT_BROWSERS_PATH  when set + a chromium-* build exists there → locked-env mode
set -euo pipefail

GSTACK_DIR="${GSTACK_DIR:?set GSTACK_DIR to your gstack checkout}"
[ -x "$(command -v bun)" ] || { echo "bun required: curl -fsSL https://bun.sh/install | bash" >&2; exit 1; }

# Detect a locked/preinstalled Chromium.
locked=0
if [ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ] && ls -d "${PLAYWRIGHT_BROWSERS_PATH}"/chromium-* >/dev/null 2>&1; then
  locked=1
fi

if [ "$locked" -eq 0 ]; then
  echo "browser-qa-setup: normal machine → delegating to gstack ./setup (may download Chromium)"
  exec "$GSTACK_DIR/setup" "$@"
fi

echo "browser-qa-setup: locked Chromium detected at $PLAYWRIGHT_BROWSERS_PATH → no-download mode"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Resolve the Playwright version to pin: explicit override, else the global playwright's version.
pin="${GSTACK_PLAYWRIGHT_VERSION:-}"
if [ -z "$pin" ] && command -v playwright >/dev/null 2>&1; then
  pin="$(playwright --version 2>/dev/null | awk '{print $2}')"
fi

cd "$GSTACK_DIR"
if [ -n "$pin" ]; then
  echo "browser-qa-setup: pinning playwright@$pin to match the preinstalled Chromium build"
  bun add "playwright@$pin"
else
  echo "browser-qa-setup: WARNING — could not determine a Playwright version to pin." >&2
  echo "  If the launch probe fails, set GSTACK_PLAYWRIGHT_VERSION to the version matching" >&2
  echo "  your preinstalled Chromium build (e.g. build 1194 -> 1.56.x) and re-run." >&2
fi

bun install
bun run build

# Verify: launch the preinstalled Chromium with zero download.
if bun --eval 'import { chromium } from "playwright"; const b = await chromium.launch(); await b.close();' >/dev/null 2>&1; then
  echo "browser-qa-setup: OK — Chromium launches from $PLAYWRIGHT_BROWSERS_PATH, no download."
else
  echo "browser-qa-setup: FAILED — probe could not launch Chromium." >&2
  echo "  Set GSTACK_PLAYWRIGHT_VERSION to the version matching your preinstalled build and re-run." >&2
  exit 1
fi

# Register skills (delegate to gstack's own symlink step).
"$GSTACK_DIR/setup" "$@" || true
