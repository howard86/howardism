"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { resolveCompareIds } from "@/lib/compare-ids";

import { CompareEmpty } from "./compare-empty";
import { type ComparePanel, CompareView } from "./compare-view";

/** Marker the article reader puts on its prose wrapper (`article-layout.tsx`). */
const ARTICLE_BODY_SELECTOR = "[data-article-body]";

const COMPARE_PATH_RE = /\/compare\/?$/;

/**
 * Pull the rendered prose node out of a prerendered article page. Returns its
 * `outerHTML` — the wrapper carries the `prose`/drop-cap classes — or `null`
 * when the page has no article body (e.g. a 404 page).
 */
export function extractArticleBody(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.querySelector(ARTICLE_BODY_SELECTOR)?.outerHTML ?? null;
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

/** Fetch an article's prerendered page and extract its body. */
export async function fetchArticleBody(
  url: string,
  signal?: AbortSignal
): Promise<string | null> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    return null;
  }
  return extractArticleBody(await res.text());
}

/** `undefined` while loading, `null` when the body could not be loaded. */
type BodyState = string | null | undefined;

function PanelBody({ html }: { html: BodyState }) {
  if (html === undefined) {
    return (
      <p className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em]">
        Loading…
      </p>
    );
  }
  if (html === null) {
    return (
      <p className="font-body text-[15px] text-muted-foreground">
        This article could not be loaded.
      </p>
    );
  }
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: same-origin HTML from this site's own prerendered article page
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/**
 * Client half of `/compare`: resolves `?ids=` against the known slugs and
 * loads each article's body from its prerendered page, so the route needs no
 * server-side `searchParams` and works under a static export.
 */
export function CompareLoader({
  titles,
}: {
  titles: Readonly<Record<string, string>>;
}) {
  const searchParams = useSearchParams();
  const idsKey = searchParams.getAll("ids").join(",");
  const slugs = useMemo(
    () => resolveCompareIds(idsKey, new Set(Object.keys(titles))),
    [idsKey, titles]
  );
  const slugsKey = slugs.join(",");
  const [bodies, setBodies] = useState<Record<string, BodyState>>({});

  useEffect(() => {
    if (slugsKey.length === 0) {
      return;
    }
    const controller = new AbortController();
    const { pathname } = window.location;
    for (const slug of slugsKey.split(",")) {
      fetchArticleBody(articleUrlFrom(pathname, slug), controller.signal)
        .catch(() => null)
        .then((html) => {
          if (!controller.signal.aborted) {
            setBodies((prev) => ({ ...prev, [slug]: html }));
          }
        });
    }
    return () => controller.abort();
  }, [slugsKey]);

  if (slugs.length === 0) {
    return <CompareEmpty />;
  }

  const panels: ComparePanel[] = slugs.map((slug) => ({
    slug,
    title: titles[slug] ?? slug,
    href: `/articles/${slug}`,
    body: <PanelBody html={bodies[slug]} />,
  }));

  return <CompareView panels={panels} />;
}
