#!/usr/bin/env bash
set -uo pipefail

# Sequentially generate missing blog hero images via the Codex CLI — one
# article at a time, with a measured ETA. The native importer runs Codex
# 6-wide and aborts the whole batch on the first codex failure; this loop
# runs one `codex exec` per slug, so each image is timed and a single
# failure is isolated (logged, skipped) instead of killing the run.
#
# Usage:  WIKI_PATH=/abs/path/to/vault  bash sequential-images.sh
# Run from the monorepo root (or apps/cli). No paths are hardcoded —
# WIKI_PATH is supplied by the caller, apps/cli is located from the CWD.
# Requires: codex CLI on PATH and logged in; bun; WIKI_PATH = Obsidian wiki root.

: "${WIKI_PATH:?set WIKI_PATH to your Obsidian wiki root}"
[ -d "$WIKI_PATH" ] || { echo "WIKI_PATH not a directory: $WIKI_PATH" >&2; exit 1; }
# Resolve to absolute now, before we cd into apps/cli.
WIKI_PATH="$(cd "$WIKI_PATH" && pwd)"
command -v codex >/dev/null || { echo "codex CLI not found on PATH" >&2; exit 1; }
command -v bun   >/dev/null || { echo "bun not found on PATH" >&2; exit 1; }

if [ -f "apps/cli/package.json" ]; then cd apps/cli
elif [ -f "package.json" ] && [ -d "src/import-wiki" ]; then :   # already in apps/cli
else echo "run this from the monorepo root (or apps/cli)" >&2; exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "==> Planning (DRY_RUN, no codex calls)…"
if ! DRY_RUN=1 WIKI_PATH="$WIKI_PATH" bun run import:wiki >"$tmp/dry.log" 2>&1; then
  echo "dry run failed:" >&2; tail -n 40 "$tmp/dry.log" >&2; exit 1
fi

# The dry-run line is: [codex] DRY_RUN — would generate image for "<title>" → <staging>/<slug>.png → <assets>/<slug>.png
# ponytail: basename-of-.png heuristic; staging+output share a basename so sort -u collapses them.
grep 'would generate' "$tmp/dry.log" \
  | grep -oE '[A-Za-z0-9._-]+\.png' \
  | sed 's/\.png$//' | sort -u >"$tmp/slugs.txt"

total=$(wc -l <"$tmp/slugs.txt" | tr -d ' ')
if [ "$total" -eq 0 ]; then
  echo "==> All hero images already present. Nothing to generate."
  exit 0
fi
echo "==> $total image(s) missing. Generating one at a time via 'codex exec'."
echo "    Per-image time is measured, not guessed — ETA appears after #1."

i=0; cum=0; failed=0
: >"$tmp/failures.txt"
while IFS= read -r slug; do
  i=$((i + 1))
  start=$SECONDS
  if WIKI_PATH="$WIKI_PATH" bun run import:wiki -- --only "$slug" >"$tmp/last.log" 2>&1; then
    dur=$((SECONDS - start)); cum=$((cum + dur))
    avg=$((cum / i)); remaining=$(((total - i) * avg))
    printf '[%d/%d] %s ✓ %ds | elapsed %dm | ETA ~%dm\n' \
      "$i" "$total" "$slug" "$dur" "$((cum / 60))" "$((remaining / 60))"
  else
    failed=$((failed + 1)); echo "$slug" >>"$tmp/failures.txt"
    printf '[%d/%d] %s ✗ FAILED (continuing) — last log lines:\n' "$i" "$total" "$slug"
    tail -n 15 "$tmp/last.log"
  fi
done <"$tmp/slugs.txt"

echo "==> Done: $((total - failed))/$total generated, $failed failed."
if [ "$failed" -gt 0 ]; then
  echo "Failed slugs:"; cat "$tmp/failures.txt"
  echo "Re-run each after checking codex auth/quota:"
  echo "  cd apps/cli && WIKI_PATH=\"$WIKI_PATH\" bun run import:wiki -- --only <slug>"
  exit 1
fi
