---
name: generate-wiki-images
description: Import an Obsidian wiki vault into the blog, validate it, then generate the hero images via the Codex CLI — one at a time, with a measured ETA and live progress. Use when the user wants to run the wiki importer against a vault, backfill or regenerate blog hero illustrations, or says "import the wiki", "generate wiki images", "regenerate blog illustrations".
---

Runs this monorepo's wiki importer (`apps/cli`) end to end: import + validate the articles first, then generate hero PNGs **sequentially**. The native importer generates images 6-wide and aborts the whole batch on the first failure; this skill imports with images off, then runs one `codex exec` at a time via a per-slug loop, so each image is timed (real ETA) and a single failure is isolated instead of killing the run.

## Input

`WIKI_PATH` — absolute path to the Obsidian wiki root, supplied by the caller (no default; a remote runner must pass it). If the user didn't give one, ask. `RAW_PATH` defaults to `<WIKI_PATH>/../raw` and needs no input. `MAX_IMAGES` (optional) caps how many images one run generates — for a smoke test or to stay under Codex quota; unset generates all missing. Run every command from the repo root.

## Steps

1. **Preflight.** On a fresh checkout, run `bun install` at the repo root first — the importer imports workspace packages (e.g. `@howardism/article-contract`) and dies with "Cannot find module" without it (bites remote runners especially). Then confirm all three: `codex --version` succeeds (Codex CLI installed *and* logged in — `codex exec` needs auth), `bun` is on PATH, and `WIKI_PATH` resolves to an existing directory. → *ready when `bun install` completes and all three check out.*

2. **Import & validate.** Import articles and manifests with images off (fast, no Codex), then validate the summary:
   ```bash
   cd apps/cli && SKIP_IMAGES=1 WIKI_PATH="$WIKI_PATH" bun run import:wiki
   ```
   Confirm the printed summary reports articles written and manifests generated with no thrown error. Unresolved wikilinks and missing-raw warnings are expected (MOC internal links resolve to `home`). → *done when the import exits 0 and `apps/blog/src/data/{article-graph,wiki-sources,open-questions}.json` are updated.* (The summary's "leaving missing asset" lines name the articles needing images — step 3 fills them.)

3. **Generate images sequentially.** From the repo root, run the bundled script — background it for a large batch and log to a file — then monitor and relay progress:
   ```bash
   WIKI_PATH="$WIKI_PATH" bash .claude/skills/generate-wiki-images/scripts/sequential-images.sh
   # smoke-test or quota-cap this run: prefix MAX_IMAGES=2
   ```
   It dry-runs first (no Codex calls) to list the slugs missing a PNG, then generates them one at a time, printing `[i/N] slug ✓ 98s | elapsed 3m | ETA ~38m` after each. The ETA is measured from real per-image time and announced after the first completes — relay it. → *done when the script prints `Done: N/N generated, 0 failed`.*

4. **Validate.** The image-presence gate is a filesystem check — every article has its hero PNG (the importer names each `<slug>.png`):
   ```bash
   cd apps/blog/src/content && comm -23 \
     <(ls articles/*.mdx | xargs -n1 basename | sed 's/\.mdx$//' | sort) \
     <(ls assets/*.png   | xargs -n1 basename | sed 's/\.png$//' | sort)
   ```
   Empty output = every article has an image. Note `bun run type-check` does **not** catch missing images — TS treats `*.png` as an opaque module, so it passes with PNGs absent; only a full `bun run build` actually fails on a missing hero (at the cost of a slow Next build). → *done when the set difference is empty.*

## Failures & regen

- A slug that fails during step 3 is listed at the end (the run does not abort). Re-check Codex auth/quota, then re-run just those: `cd apps/cli && WIKI_PATH="$WIKI_PATH" bun run import:wiki -- --only <slug>`.
- Cache is filename-only: to regenerate a changed article's image, delete `apps/blog/src/content/assets/<slug>.png` first, then re-run step 3.

## Gotchas (from prior runs)

- **Codex must be logged in**, not just installed — `codex exec` shells to the local Codex CLI's default model (no `--model` is passed) and uses its `$imagegen` skill. A cold/unauthed CLI fails the image.
- **No retry, no timeout in the importer.** A hung `codex exec` blocks forever; the per-slug loop limits the blast radius to one image — watch the log and Ctrl-C a stuck image if needed.
- **Fail-loud, no placeholders.** A missing/invalid PNG (magic-byte check) throws; there is no silent placeholder fallback.
- **Codex sandbox staging.** Images render into `apps/cli/.codex-staging/` (inside Codex's `workspace-write` sandbox) and then move to `assets/`. Run from the repo, or the sandbox can't write.
- **Non-fatal noise is normal.** Missing Python `PIL`/`numpy` warnings and an ImageMagick draw error have appeared without blocking past runs — don't chase them.
- **Deleting a live hero PNG 404s its article** (the MDX statically imports it). Only delete when regenerating.
- **~2 MB per PNG, ~90–120 s each** (measured 98–109 s on codex 0.144). ~30 images ≈ 50 min — hence the background run, ETA, and `MAX_IMAGES` cap.
- **Per-slug re-parse.** Each `--only` run re-parses the whole vault; that overhead is a few percent of Codex time — the price of clean sequential timing and failure isolation.
