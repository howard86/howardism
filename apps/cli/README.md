# @howardism/cli

Internal Bun-runtime scripts for the monorepo.

## Scripts

### `import:wiki`

Ingests `obsidian-vault/Howardism/wiki/` into `apps/blog` as MDX articles.

```bash
# Full run (calls Codex CLI for image generation on new articles)
bun run import:wiki

# Skip image generation (for fast iteration on the transform)
SKIP_IMAGES=1 bun run import:wiki

# Plan only — log planned writes without touching disk
DRY_RUN=1 bun run import:wiki

# Limit to a single slug
bun run import:wiki -- --only claude-code
```

Env vars:

| Var | Default | Purpose |
|---|---|---|
| `WIKI_PATH` | `../../../obsidian-vault/Howardism/wiki` | Absolute or relative path to the Obsidian wiki root. |
| `BLOG_ARTICLES_PATH` | `../blog/src/app/(blog)/articles/[slug]/(docs)` | Where to write `page.mdx` folders. |
| `SKIP_IMAGES` | unset | When `1`, bypasses Codex calls and leaves placeholder image refs. The blog will fail type-check until images exist. |
| `DRY_RUN` | unset | When `1`, plans all writes and prints the summary but does not touch disk. |

Per-slug category overrides live in `wiki-category-overrides.json`.
