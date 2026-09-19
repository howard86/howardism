import { createHash } from "node:crypto";

import matter from "gray-matter";

/**
 * The "translatable surface" of a source article: exactly the parts an engine
 * rewrites when translating. Hashing this (and ONLY this) is what makes
 * staleness detection robust against importer reformats — a change to a
 * copy-verbatim field (date/readingTime/tag/domain) does NOT alter the hash, so
 * it never triggers a paid re-translation.
 */
export interface TranslatableSurface {
  body: string;
  description: string;
  imageAlt: string;
  sources: { title: string; url: string }[];
  tags: string[];
  title: string;
}

const asString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value == null) {
    return "";
  }
  return String(value).trim();
};

const normalizeBody = (body: string): string =>
  body.replace(/\r\n/g, "\n").trim();

/**
 * A frontmatter parse the caller already has. Structurally what gray-matter
 * returns, so a `matter()` result passes straight in.
 */
export interface ParsedFrontmatter {
  content: string;
  data: Record<string, unknown>;
}

/**
 * The translatable surface of an ALREADY-PARSED article, for callers that
 * parsed the frontmatter for their own reasons — `matter()` is the expensive
 * half of {@link surfaceHash}, and several of them were paying for it twice.
 *
 * The parse must be equivalent to gray-matter's default: `title`,
 * `description`, `imageAlt`, `tags` and `sources` are read straight out of
 * `data`, so a YAML engine that types any of them differently (a bare `no` as
 * a boolean, a bare date as a Date) would change the digest for unchanged
 * content — and `sourceHash` is committed and compared by `translate:check`.
 */
export function translatableSurfaceFrom(
  parsed: ParsedFrontmatter
): TranslatableSurface {
  const { data, content } = parsed;
  const d = data;
  const rawSources = Array.isArray(d.sources) ? d.sources : [];
  return {
    title: asString(d.title),
    description: asString(d.description),
    imageAlt: asString(d.imageAlt),
    tags: Array.isArray(d.tags) ? d.tags.map(asString) : [],
    sources: rawSources.map((s) => {
      const entry = (s ?? {}) as Record<string, unknown>;
      return { title: asString(entry.title), url: asString(entry.url) };
    }),
    body: normalizeBody(content),
  };
}

/** Parse the translatable surface out of a raw source MDX string. */
export function extractTranslatableSurface(
  rawMdx: string
): TranslatableSurface {
  return translatableSurfaceFrom(matter(rawMdx, {}));
}

/**
 * Stable SHA-256 over the translatable surface. The digest input is a JSON
 * array assembled in an EXPLICIT, fixed element order — not a stringified
 * object — so that neither a formatter reordering the surface object literal
 * nor a future refactor can change the hash for unchanged content.
 */
export function surfaceHash(rawMdx: string): string {
  return surfaceHashFrom(matter(rawMdx, {}));
}

/** {@link surfaceHash} over an already-parsed article — see the caveat on
 * {@link translatableSurfaceFrom}. */
export function surfaceHashFrom(parsed: ParsedFrontmatter): string {
  const s = translatableSurfaceFrom(parsed);
  const canonical = JSON.stringify([
    s.title,
    s.description,
    s.imageAlt,
    s.tags,
    s.sources,
    s.body,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}
