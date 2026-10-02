# R2 content migration

Production content moves out of Git into immutable, content-addressed releases on
R2. A build prepares and verifies the pinned release before Next.js runs. The
code lives in `apps/cli/src/content/`, and the root `content:*` scripts call it.
Gate status and evidence are in [STATUS.md](STATUS.md).

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

**Cloudflare.** Create two buckets:
- `howardism-content-prod`: private, Standard storage, with no custom domain and
  no `r2.dev` URL.
- `howardism-content-fixtures`: public. Its `r2.dev` endpoint is rate limited,
  so attach a custom domain if preview traffic grows, then update the sample pin
  URL.

Create bucket-scoped S3 tokens:

| Token | Permission | Lives in |
|---|---|---|
| Full publisher | Read & Write on `-prod` | A mode-0600 file outside Git (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) |
| Full build | Read only on `-prod` | Vercel production env vars; the `content-integration` GitHub environment |
| Fixture publisher | Read & Write on `-fixtures` | `../.r2-fixture-publisher.env`, mode 0600 (`R2_FIXTURE_ACCESS_KEY_ID`, `R2_FIXTURE_SECRET_ACCESS_KEY`) |

Wrangler's OAuth login (`bun run cloudflare login`) handles bucket admin only; it
does not replace these S3 keys. Never put keys in a PR, a chat or
`NEXT_PUBLIC_*`. R2 is metered, and usage alerts are not billing caps.

**Vercel.**
- Keep the project root at `apps/blog`.
- Production gets the read-only keys and `CONTENT_PROFILE=full`; previews get
  neither.
- Enable the system environment variables.
- Make sure no ignored-build-step rule skips a commit that only changes
  `content.lock.json`, because publishing content is exactly that kind of commit.
- Restrict manual promotion in the dashboard: code can't stop an admin from
  promoting a sample build. Promote only builds that pass
  `content:verify-deployment`. If you can't enforce that, rebuild in production.
- For strict preview isolation, use a separate preview project with no R2
  secrets. Otherwise Vercel may restore a production object cache into a
  preview.

**GitHub.** The `content-integration` environment needs required reviewers and
the read-only keys. No PR-triggered job may receive R2 secrets.

## Publishing

```sh
CONTENT_ROOT=/path/to/full-content bun run --cwd apps/cli import:wiki   # then translate, build:*
bun run content:validate --profile full --root /path/to/full-content
bun run content:pack --root /path/to/full-content --destination /path/to/candidate
bun run content:publish --candidate /path/to/candidate --maintenance-root /path/to/full-content --base <previous digest>
bun run content:pin --release <digest>        # read-only keys suffice from here on
```

Use `--initial` instead of `--base` only for the first release. Use the same
authoring root as `--maintenance-root` for publish and GC: they share one lock,
and that lock is local to one machine.

Back up what releases don't carry: the raw wiki and the CLI's SQLite state
(`content:backup-local`). Keep a second copy off the authoring machine. Rehearse
a restore by running `content:export` into a fresh root and comparing inventory
digests.

## Sample refresh

```sh
bun run content:fixtures --root /path/to/full-authoring --destination /path/to/sample-authoring
bun run content:fixtures-pack --root /path/to/sample-authoring --destination /path/to/packed-sample
bun run content:fixtures-publish --root /path/to/sample-authoring --bucket howardism-content-fixtures
bun run content:fixtures-pin --release <digest> --public-base-url <bucket url>
```

The fixture bucket is public, so it holds only the reduced sample: never a full
release, authoring history, credentials or SQLite files.

## Before promoting a full build

1. Dispatch `content-integration.yml` for the exact commit. It runs cold and
   warm full builds and produces a receipt.
2. Run `content:verify-deployment --url <candidate> --commit <sha>`.
3. Run `content:verify-parity --baseline <production url> --candidate <url> --spec docs/r2-migration/parity-probes.json`.
   Review the probes against the chosen baseline first. Pass two `*.vercel.app`
   deployment URLs: the custom domain's canonical URL is normalized on one side
   only and produces false mismatches.

An empty parity diff doesn't cover graph interaction, search behaviour,
on-demand routes or independence from R2 at runtime. Check those in a browser.

## Cutover

The public sample is pinned and `fixtures/content/` is already untracked. After
G0–G3 pass, the final commit of this PR:

- pins the private full release;
- untracks `apps/blog/src/content/` and exactly the seven generated manifests in
  `apps/blog/src/data/`, adding ignore rules for them. Leave the hand-maintained
  files in that directory alone.

That commit must then pass fresh-clone cold full and sample builds and a
lockfile-only deployment before merge (G4). Untracking leaves the objects in Git
history; rewriting history needs separate authorization.

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

Keep a private, reviewed publication ledger. GC protects:

- the current release;
- the ten previous distinct approved releases;
- every release from the last 90 days;
- rollback pins and active candidates.

It deletes only unreferenced objects older than seven days. These numbers are
operational choices, not provider limits.

Live GC stays off until G6. Before applying a plan, freeze publishing on every
host, because the lock is local to one machine. A lock older than the retention
window may need a restore from backup.
