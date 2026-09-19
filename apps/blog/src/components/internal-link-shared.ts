/**
 * The parts of `internal-link.tsx` that server components need.
 *
 * They cannot live in `internal-link.tsx` itself: that module is
 * `"use client"`, and Next hands a server component a client-reference proxy
 * — not the value — for every export of a client module. `PREVIEW_DESCRIPTION_MAX`
 * arrived as a proxy, so `truncate(description, proxy)` computed
 * `slice(0, NaN)` and every shipped preview description was a bare "…";
 * `href.startsWith(ARTICLES_PREFIX)` in `mdx-components.tsx` was false for
 * every href, so in-article links never got a preview at all.
 */

export const ARTICLES_PREFIX = "/articles/";

/** Callers truncate the description to this before it reaches the preview. */
export const PREVIEW_DESCRIPTION_MAX = 140;

const SLUG_TERMINATOR_RE = /[?#/]/;

export function extractArticleSlug(href: string): string | null {
  if (!href.startsWith(ARTICLES_PREFIX)) {
    return null;
  }
  const remainder = href.slice(ARTICLES_PREFIX.length);
  const [slug] = remainder.split(SLUG_TERMINATOR_RE);
  return slug.length > 0 ? slug : null;
}
