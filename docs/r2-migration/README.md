# R2 content migration

Production content moves out of Git into immutable, content-addressed releases on
R2. A build prepares and verifies the pinned release before Next.js runs.

The migration deliberately adds no database, CMS, Worker, content API or runtime
MDX compilation. Readers never reach R2.

## Invariants

These are the rules the code depends on but doesn't explain.

- **Authoring and builds use separate roots.** Authoring happens in an external
  root (`CONTENT_ROOT`), and builds only ever materialize into `apps/blog/src`.
  If they shared a root, preparing a preview could overwrite or prune the next
  production publication.
- **The R2 hash is only for transport integrity.** It never replaces the
  `sourceHash` that drives translation staleness.
- **Production never falls back.** A failed download or verification aborts the
  build. It never substitutes the sample or another release.
- **No age-only lifecycle rule on `objects/`.** Objects are shared across
  releases, so an old object can still belong to the current release. Deletion
  goes through reference-based GC only.
- **The object cache is an optimization, not storage.** Vercel caps
  `.next/cache` at 1 GB and keeps it for a month. Durability comes from R2 plus
  independent backups.

## External setup

None of this is in the repo.

**Cloudflare.** Two buckets:
- `howardism-content-prod`: private, Standard storage, with no custom domain and
  no `r2.dev` URL.
- `howardism-content-fixtures`: public. Its `r2.dev` endpoint is rate limited,
  so attach a custom domain if preview traffic grows, then update the sample pin
  URL.

Bucket-scoped S3 tokens:

| Token | Permission | Lives in |
|---|---|---|
| Full publisher | Read & Write on `-prod` | macOS keychain item `howardism-r2-publisher`, read by `../bin/with-r2 publisher` |
| Full build | Read only on `-prod` | Vercel production env vars; the `content-integration` GitHub environment; keychain item `howardism-r2-build` |
| Fixture publisher | Read & Write on `-fixtures` | `../.r2-fixture-publisher.env`, mode 0600 |

The S3 keys come only from the dashboard (R2 → Manage API tokens): Wrangler's
OAuth login handles bucket admin and cannot issue them. Never put keys in a PR,
a chat or `NEXT_PUBLIC_*`. R2 is metered, and usage alerts are not billing caps.

**Vercel.** The Hobby plan allows no custom environments, so no pre-merge path
deploys a full build: previews reject `full`, and `content-integration.yml`
builds but doesn't deploy. A full build is first verified on production, with
the previous deployment kept for instant rollback.
- Production gets the read-only keys and `CONTENT_PROFILE=full`; previews get
  neither.
- Make sure no ignored-build-step rule skips a commit that only changes
  `content.lock.json`, because publishing content is exactly that kind of commit.
- Restrict manual promotion in the dashboard: code can't stop an admin from
  promoting a sample build. Promote only builds that pass
  `content:verify-deployment`.
- Previews restore the production build cache, including the object cache. For
  strict preview isolation, use a separate preview project with no R2 secrets.
- `vercel redeploy` skips the build cache, so it says nothing about object-cache
  reuse; only a Git-triggered build does. A preview restoring a cache saved by a
  redeploy has failed with `ENOENT` on a traced `node_modules` file; a cache-less
  redeploy of the same commit passed.

**GitHub.** The `content-integration` environment needs required reviewers and
the read-only keys. No PR-triggered job may receive R2 secrets.

## Publishing

Import into the authoring root, never into `apps/blog/src`. Use the same
authoring root as `--maintenance-root` for publish and GC: they share one lock,
and that lock is local to one machine. Publishing content identical to the
current release is a no-op that returns the same digest.

Back up what releases don't carry: the raw wiki and the CLI's SQLite state.
Keep a second copy off the authoring machine. Rehearse a restore by exporting
into a fresh root and comparing inventory digests.

The fixture bucket is public, so it holds only the reduced sample: never a full
release, authoring history, credentials or SQLite files.

## Before promoting a full build

1. Dispatch `content-integration.yml` for the exact commit.
2. Run `content:verify-deployment` against the candidate.
3. Run `content:verify-parity` with `docs/r2-migration/parity-probes.json`,
   after reviewing the probes against the chosen baseline. Pass two
   `*.vercel.app` deployment URLs: the custom domain's canonical URL is
   normalized on one side only and produces false mismatches.

An empty parity diff doesn't cover graph interaction, search behaviour,
on-demand routes or independence from R2 at runtime. Check those in a browser.

## Cutover

`apps/blog/src/content/` and the seven generated manifests in
`apps/blog/src/data/` are untracked and ignored; every build materializes them
from the pinned release. Their old revisions remain in Git history until a
separately authorized rewrite strips them.

Content rollback to a previous release can't be rehearsed until a second
release exists.

## Rollback

| Incident | Response |
|---|---|
| Content regression | Point `content.lock.json` at a retained compatible release and rebuild |
| Renderer or schema regression | Roll application and content back together; an older manifest may not suit newer code |
| Activation fails | Restore the previous Vercel deployment and verify its marker and routes |
| Build can't read R2 | Keep the running deployment and retry after the repair |
| Credential compromise | Rotate the keys, review writes, and re-verify digests before publishing again |
| Retained release won't rebuild | Restore it from backup, record what was missing, and suspend GC |

## Retention

GC reads a private, reviewed publication ledger kept beside the checkout
(`../howardism-content-publication-ledger.json`). Take each release's
`publishedAt` from the R2 `LastModified` of its manifest, not from local logs.
The retention windows are operational choices, not provider limits.

Live GC stays off until stability is observed, a restore is demonstrated and a
dry-run plan is approved. Before applying a plan, freeze publishing on every
host, because the lock is local to one machine. A lock older than the retention
window may need a restore from backup.
