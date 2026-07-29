# Shrinking the repository history

`.git` is ~640MB. 91% of that is hero-image PNGs that no longer exist in the
tree — the WebP migration replaced them, but every historical revision is still
carried in the pack forever.

Stripping those blobs from history takes the repo **641MB → 48MB (13.4x)**,
measured on a real dry run, with all 1889 commits, 35 branches and 198 tags
preserved and `main`'s tree byte-identical.

This is a one-time operation. Delete this file and the script once it is done.

## Before you decide

A history rewrite changes **every commit SHA in the repository**. It invalidates
every clone, every open pull request, and every link to a commit. If the goal is
only "make cloning cheap", the cheaper option needs no rewrite at all:

```bash
git clone --filter=blob:none git@github.com:howard86/howardism.git
```

That fetches blobs on demand and gives a small working clone today, with zero
coordination cost. Rewrite only if you want the history genuinely gone — e.g. to
shrink the repository GitHub actually stores.

## What gets removed

Only large raster files. **No source code, and no file currently in the tree.**

| bytes in history | path |
|---|---|
| 565.2MB | `apps/blog/src/content/assets/*.png` — hero art, superseded by WebP |
| 11.5MB | `apps/blog/src/app/(blog)/articles/[slug]/(docs)/(assets)` — dead route |
| 12.1MB | four unreferenced stock photos + `public/cover.jpg` |
| 2.9MB | `apps/recipe/public/assets/*` — assets of a removed workspace |

Explicitly **kept**: every favicon, `android-chrome-*`, `apple-touch-icon`,
`mstile-150x150`, `profile.jpeg`, `assets/texture.png` and the five
`assets/icons/*.jpg`. All are live; all are small. An early draft used
`--path-glob 'apps/blog/public/assets/*.jpg'` and the `*` matched across the
`/`, which would have silently deleted those five icons — the script now lists
each file explicitly.

## Preconditions

1. **The WebP migration (PR #900) must be merged first.** Until it is, `main`'s
   heroes are still PNGs, so the rewrite would strip them out of the live tree
   and every article would lose its image. The script enforces this: it compares
   `main`'s tree hash before and after and aborts, naming every file at risk, if
   they differ.
2. **Merge or close every other open PR.** There were 13 at the time of writing.
   Their branches are rewritten too, but a PR's merge-base is not, so GitHub will
   show them as wildly conflicted. The Renovate ones are disposable — close them
   and let the bot reopen against the new history.
3. Install the tool: `brew install git-filter-repo`.

## Running it

```bash
./scripts/shrink-git-history.sh /tmp/howardism-rewrite
```

It mirror-clones from GitHub, rewrites, repacks, verifies `main` is unchanged,
and prints the resulting size. **It does not push.** Expected output ends with
`main tree unchanged: <hash>` and a non-zero exit if anything is off.

Then publish, deliberately:

```bash
# 1. Lift branch protection on main (Settings → Branches) — force-push is blocked otherwise.
# 2. Push every ref, including the 198 rewritten tags:
git -C /tmp/howardism-rewrite/howardism.git push --force --mirror git@github.com:howard86/howardism.git
# 3. Re-enable branch protection.
```

## Afterwards

- **Re-clone.** Every existing clone and `git worktree` is now based on dead
  SHAs; do not try to rebase them. Delete and clone fresh.
- **Forks.** Two exist. They keep the old history and are unaffected — but a PR
  from a stale fork will be unmergeable until it re-forks.
- **Releases.** GitHub Releases attach to tag *names*, which survive; the commit
  each points at gets a new SHA.
- **Vercel** redeploys from the new `main`. Previous deployments reference SHAs
  that no longer exist, which is harmless.
- **GitHub's stored size may lag.** New clones are small immediately, but
  unreachable objects can linger server-side; ask GitHub Support to run `gc` if
  the repository size on their end matters.
- Sanity-check a fresh clone:
  ```bash
  git clone git@github.com:howard86/howardism.git && cd howardism
  du -sh .git && bun install && bun run build && cd apps/cli && bun run content:check
  ```
