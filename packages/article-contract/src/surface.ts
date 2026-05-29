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

/** Parse the translatable surface out of a raw source MDX string. */
export function extractTranslatableSurface(
  rawMdx: string
): TranslatableSurface {
  const { data, content } = matter(rawMdx);
  const d = data as Record<string, unknown>;
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

/**
 * Stable SHA-256 over the translatable surface. The digest input is a JSON
 * array assembled in an EXPLICIT, fixed element order — not a stringified
 * object — so that neither a formatter reordering the surface object literal
 * nor a future refactor can change the hash for unchanged content.
 */
export function surfaceHash(rawMdx: string): string {
  const s = extractTranslatableSurface(rawMdx);
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
