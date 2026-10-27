"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CompareEmpty } from "./compare-empty";
import { type ComparePanel, CompareView } from "./compare-view";

/** Marker the article reader puts on its prose wrapper (`article-layout.tsx`). */
const ARTICLE_BODY_SELECTOR = "[data-article-body]";

const COMPARE_PATH_RE = /\/compare\/?$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Pull the rendered prose node out of a prerendered article page. Returns its
 * `outerHTML` — the wrapper carries the `prose`/drop-cap classes — or `null`
 * when the page has no article body (e.g. a 404 page).
 */
export function extractArticleBody(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.querySelector(ARTICLE_BODY_SELECTOR)?.outerHTML ?? null;
}

export function extractArticleTitle(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const heading = doc.querySelector("article h1") ?? doc.querySelector("h1");
  return heading?.textContent?.trim() || doc.title || null;
}

/**
 * The URL of an article's prerendered page, built off the current `/compare`
 * URL: its prefix is the site's base path (a GitHub Pages project prefix, or
 * empty at the Vercel root), and its trailing slash follows the route
 * convention — `/compare/` on a `trailingSlash` static export, `/compare` on
 * Vercel. Matching the convention matters: the static host 301s a slash-less
 * path, and under the CSP's `upgrade-insecure-requests` an HTTP redirect is
 * upgraded to HTTPS and fails.
 */
export function articleUrlFrom(comparePathname: string, slug: string): string {
  const match = COMPARE_PATH_RE.exec(comparePathname);
  const basePath = match
    ? comparePathname.slice(0, match.index)
    : comparePathname;
  const trailingSlash = match?.[0].endsWith("/") ? "/" : "";
  return `${basePath}/articles/${slug}${trailingSlash}`;
}

/**
 * `"missing"` when the slug has no page (404): without a server-side title map,
 * that is how an unknown `?ids=` value is recognised and dropped. `null` for
 * any other failure, which the panel reports.
 */
export async function fetchArticlePage(
  url: string,
  signal?: AbortSignal
): Promise<{ body: string; title: string } | "missing" | null> {
  const res = await fetch(url, { signal });
  if (res.status === 404) {
    return "missing";
  }
  if (!res.ok) {
    return null;
  }
  const html = await res.text();
  const body = extractArticleBody(html);
  const title = extractArticleTitle(html);
  return body && title ? { body, title } : null;
}

/** `undefined` while loading, `null` when the body could not be loaded. */
type BodyState = { body: string; title: string } | null | undefined;
type FetchState = BodyState | "missing";

function PanelBody({ page }: { page: BodyState }) {
  if (page === undefined) {
    return (
      <p className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em]">
        Loading…
      </p>
    );
  }
  if (page === null) {
    return (
      <p className="font-body text-[15px] text-muted-foreground">
        This article could not be loaded.
      </p>
    );
  }
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: same-origin HTML from this site's own prerendered article page
    <div dangerouslySetInnerHTML={{ __html: page.body }} />
  );
}

/**
 * Client half of `/compare`: resolves slug-shaped `?ids=` values and
 * loads each article's body from its prerendered page, so the route needs no
 * server-side `searchParams` and works under a static export.
 */
export function CompareLoader() {
  const searchParams = useSearchParams();
  const idsKey = searchParams.getAll("ids").join(",");
  const slugs = useMemo(() => {
    const accepted = new Set<string>();
    for (const candidate of idsKey.split(",")) {
      if (SLUG_RE.test(candidate)) {
        accepted.add(candidate);
      }
      if (accepted.size === 3) {
        break;
      }
    }
    return [...accepted];
  }, [idsKey]);
  const slugsKey = slugs.join(",");
  const [bodies, setBodies] = useState<Record<string, FetchState>>({});

  useEffect(() => {
    if (slugsKey.length === 0) {
      return;
    }
    const controller = new AbortController();
    const { pathname } = window.location;
    for (const slug of slugsKey.split(",")) {
      fetchArticlePage(articleUrlFrom(pathname, slug), controller.signal)
        .catch(() => null)
        .then((page) => {
          if (!controller.signal.aborted) {
            setBodies((prev) => ({ ...prev, [slug]: page }));
          }
        });
    }
    return () => controller.abort();
  }, [slugsKey]);

  const known = slugs.filter((slug) => bodies[slug] !== "missing");
  if (known.length === 0) {
    return <CompareEmpty />;
  }

  const panels: ComparePanel[] = known.map((slug) => {
    const page = bodies[slug] as BodyState;
    return {
      slug,
      title: page ? page.title : slug,
      href: `/articles/${slug}`,
      body: <PanelBody page={page} />,
    };
  });

  return <CompareView panels={panels} />;
}
