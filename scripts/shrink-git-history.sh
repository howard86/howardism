#!/usr/bin/env bash
#
# One-time history rewrite: drop the large raster blobs the repo no longer uses.
# Measured 641MB -> 48MB (13.4x) across 1886 commits, 34 branches, 198 tags.
#
# Read scripts/shrink-git-history.md BEFORE running this. It rewrites every
# commit SHA in the repository, which breaks every existing clone, every open
# pull request, and every fork. This script deliberately stops before the push —
# it prepares a rewritten mirror and prints the command that would publish it.
#
#   ./scripts/shrink-git-history.sh /tmp/howardism-rewrite
#
set -euo pipefail

WORKDIR="${1:-}"
if [[ -z "$WORKDIR" ]]; then
  echo "usage: $0 <empty-working-directory>" >&2
  exit 64
fi
if [[ -e "$WORKDIR" ]]; then
  echo "error: $WORKDIR already exists — point at a fresh path" >&2
  exit 64
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
  cat >&2 <<'MSG'
error: git-filter-repo not found.
  brew install git-filter-repo   (or: pipx install git-filter-repo)
MSG
  exit 69
fi

REMOTE="${REMOTE:-git@github.com:howard86/howardism.git}"
MIRROR="$WORKDIR/howardism.git"

# Paths stripped from every commit. All of these are either already deleted from
# the tree or belong to an app that no longer exists, so the rewritten HEAD is
# byte-identical to today's — verify that with the check at the end.
#
# Deliberately NOT stripped: apps/blog/public/{favicon*,android-chrome*,
# apple-touch-icon,mstile}*, profile.jpeg, assets/texture.png and
# assets/icons/*.jpg. They are live, and small. An earlier draft used
# `--path-glob 'apps/blog/public/assets/*.jpg'`, which matched across the `/`
# and would have deleted the five live icons — hence the explicit list.
FILTER_ARGS=(
  --invert-paths
  # 565MB — the hero illustrations, replaced by WebP twins (see PR #900).
  --path-glob 'apps/blog/src/content/assets/*.png'
  # 11.5MB — hero assets under an article route that no longer exists.
  --path 'apps/blog/src/app/(blog)/articles/[slug]/(docs)/(assets)'
  # 12.1MB — unreferenced stock photography, deleted from the tree in PR #900.
  --path 'apps/blog/public/assets/alexandre-debieve-chip.jpg'
  --path 'apps/blog/public/assets/thisisengineering-raeng-desk.jpg'
  --path 'apps/blog/public/assets/carl-heyerdahl-desk.jpg'
  --path 'apps/blog/public/assets/john-morgan-sudoku.jpg'
  --path 'apps/blog/public/cover.jpg'
  # 2.9MB — assets of the removed `apps/recipe` workspace.
  --path 'apps/recipe/public/assets/demo.jpg'
  --path 'apps/recipe/public/assets/background.jpg'
)

mkdir -p "$WORKDIR"
echo "==> mirror-cloning $REMOTE"
# A local REMOTE (handy for rehearsing against a checkout) would otherwise be
# hardlinked into the mirror, which filter-repo rejects as "not a fresh clone".
CLONE_OPTS=()
[[ -d "$REMOTE" ]] && CLONE_OPTS+=(--no-local)
git clone --mirror "${CLONE_OPTS[@]}" "$REMOTE" "$MIRROR"
before=$(du -sh "$MIRROR" | cut -f1)
tree_before=$(git -C "$MIRROR" rev-parse main^{tree})
# filter-repo prunes the pre-rewrite objects, so snapshot the file list now —
# it is what makes the failure message below able to name the lost files.
git -C "$MIRROR" ls-tree -r --name-only main | sort >"$WORKDIR/main-files-before.txt"

echo "==> rewriting history"
git -C "$MIRROR" filter-repo "${FILTER_ARGS[@]}"

echo "==> repacking"
git -C "$MIRROR" reflog expire --expire=now --all
git -C "$MIRROR" gc --prune=now --quiet
after=$(du -sh "$MIRROR" | cut -f1)

echo
echo "size:     $before -> $after"
echo "branches: $(git -C "$MIRROR" for-each-ref --format='%(refname)' refs/heads | wc -l | tr -d ' ')"
echo "tags:     $(git -C "$MIRROR" tag | wc -l | tr -d ' ')"
echo "commits:  $(git -C "$MIRROR" rev-list --count main) on main"
echo "==> verifying main's working tree is byte-identical"
# The entire safety argument in one assertion: commit SHAs are expected to
# change, but the *content* of main must not. A mismatch means main still
# references one of the stripped paths — which is true until the WebP migration
# (PR #900) is merged, since main's heroes are still PNGs at that point.
tree_after=$(git -C "$MIRROR" rev-parse main^{tree})
if [[ "$tree_before" != "$tree_after" ]]; then
  echo >&2
  echo "ABORT: the rewrite changed main's content." >&2
  echo "  before: $tree_before" >&2
  echo "  after:  $tree_after" >&2
  echo "Files that would be lost from main:" >&2
  git -C "$MIRROR" ls-tree -r --name-only main | sort \
    | comm -23 "$WORKDIR/main-files-before.txt" - | sed 's/^/  /' >&2
  echo >&2
  echo "Merge the WebP migration (PR #900) before rewriting, then re-run." >&2
  exit 1
fi
echo "main tree unchanged: $tree_after"
echo
cat <<MSG
Nothing has been pushed. Publishing is a separate, deliberate step:

  git -C "$MIRROR" push --force --mirror "$REMOTE"

Do not run that until scripts/shrink-git-history.md's checklist is done —
in particular, every open PR must be merged or closed first.
MSG
