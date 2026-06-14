import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Phase 5 of the layout unification — the CI guard that keeps the system from
 * drifting: every public page must take its frame from <PlatePage> (width via
 * the max-w-read/index/wide tokens, gutter via px-gutter) rather than
 * hand-rolling it.
 *
 * This is deliberately narrower than the handoff's literal grep
 * (`max-w-[…px]|px-4|px-8`). That pattern also matches legitimate things the
 * design relies on — content-measure caps like `max-w-[680px]` on a paragraph,
 * button padding like `px-4` on the header nav, and the global frame's
 * `sm:px-8` in (blog)/layout.tsx — so it would fail on correct code. Instead we
 * forbid the two things that actually signal a hand-rolled page frame: a raw
 * page-container width anywhere, and a raw page gutter on a route entry.
 */

const BLOG_APP_DIR = join(import.meta.dir, "../../app/(blog)");

/** The former page-container widths — now the read/index/wide tokens. */
const RAW_PAGE_WIDTH = /max-w-\[(?:720|1120|1280|1320)px\]/;
/** A raw horizontal page gutter (bare or responsive-prefixed). */
const RAW_GUTTER = /\bpx-[48]\b/;

function blogFiles(predicate: (path: string) => boolean): string[] {
  return readdirSync(BLOG_APP_DIR, { recursive: true })
    .map(String)
    .filter((rel) => rel.endsWith(".tsx") || rel.endsWith(".ts"))
    .filter(predicate)
    .map((rel) => join(BLOG_APP_DIR, rel));
}

describe("page frame guard", () => {
  it("never sets a raw page-container width — use max-w-read/index/wide", () => {
    const offenders = blogFiles(() => true).filter((file) =>
      RAW_PAGE_WIDTH.test(readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });

  it("never sets a raw gutter on a route entry — render <PlatePage>", () => {
    const offenders = blogFiles((rel) => rel.endsWith("page.tsx")).filter(
      (file) => RAW_GUTTER.test(readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });
});
