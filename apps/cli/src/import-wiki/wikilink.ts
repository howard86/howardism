/** Single source of truth for the [[wikilink]] grammar.
 *  Group 1 = target (incl. any wiki/ or raw/ prefix and #anchor).
 *  Group 2 = optional label, after `|` or Obsidian's table-escaped `\|`. */
const WIKILINK_RE = /\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/g;

const HUMANIZE_RE = /[._-]+/g;
const WHITESPACE_RE = /\s+/g;

export type WikiTarget =
  | { kind: "internal"; slug: string; anchor: string | null }
  | { kind: "raw"; rawSlug: string };

export interface WikiToken {
  label: string | null;
  target: WikiTarget;
}

/** Normalisation lives HERE and nowhere else. */
function classifyTarget(rawTarget: string): WikiTarget {
  if (rawTarget.startsWith("raw/")) {
    return { kind: "raw", rawSlug: rawTarget.slice("raw/".length) };
  }
  const bare = rawTarget.split("/").pop() ?? rawTarget;
  const hash = bare.indexOf("#");
  const slugPart = hash >= 0 ? bare.slice(0, hash) : bare;
  const anchor = hash >= 0 ? bare.slice(hash + 1) : null;
  return { kind: "internal", slug: slugPart.trim().toLowerCase(), anchor };
}

/** Humanise a raw slug: replace punctuation with spaces, collapse whitespace. */
export function humanize(raw: string): string {
  const decoded = raw
    .replace(HUMANIZE_RE, " ")
    .replace(WHITESPACE_RE, " ")
    .trim();
  return decoded.length > 0 ? decoded : raw;
}

/** Title-case a hyphenated slug. */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** Scan once; classify every match. Source order. No dedup. */
export function tokenizeWikilinks(input: string): WikiToken[] {
  const tokens: WikiToken[] = [];
  for (const match of input.matchAll(WIKILINK_RE)) {
    const target = match[1];
    const label = match[2] ? match[2].trim() : null;
    tokens.push({ label, target: classifyTarget(target) });
  }
  return tokens;
}

/** Internal slugs (kind==="internal"), source order, lowercased + anchor-stripped. */
export function extractInternalSlugs(
  input: string,
  opts?: { dedup?: boolean }
): string[] {
  const slugs: string[] = [];
  const seen = opts?.dedup ? new Set<string>() : null;
  for (const match of input.matchAll(WIKILINK_RE)) {
    const target = match[1];
    if (target.startsWith("raw/")) {
      continue;
    }
    const bare = target.split("/").pop();
    if (!bare) {
      continue;
    }
    const hash = bare.indexOf("#");
    const slug = (hash >= 0 ? bare.slice(0, hash) : bare).trim().toLowerCase();
    if (seen) {
      if (seen.has(slug)) {
        continue;
      }
      seen.add(slug);
    }
    slugs.push(slug);
  }
  return slugs;
}

/** Raw slugs (kind==="raw"), source order, ORIGINAL case + sub-paths. */
export function extractRawSlugs(
  input: string,
  opts?: { dedup?: boolean }
): string[] {
  const slugs: string[] = [];
  const seen = opts?.dedup ? new Set<string>() : null;
  for (const match of input.matchAll(WIKILINK_RE)) {
    const target = match[1];
    if (!target.startsWith("raw/")) {
      continue;
    }
    const rawSlug = target.slice("raw/".length);
    if (!rawSlug) {
      continue;
    }
    if (seen) {
      if (seen.has(rawSlug)) {
        continue;
      }
      seen.add(rawSlug);
    }
    slugs.push(rawSlug);
  }
  return slugs;
}

/** Replace each wikilink with its plain-text display form. Single-pass. */
export function stripToText(input: string): string {
  return input.replace(WIKILINK_RE, (_match, target, label) => {
    if (label) {
      return String(label).trim();
    }
    const path = String(target);
    const slug = path.split("/").pop() ?? path;
    if (path.startsWith("raw/")) {
      return humanize(slug);
    }
    return titleFromSlug(slug);
  });
}

export type WikiResolver = (token: WikiToken) => string;

/** Replace each wikilink via the injected resolver. Single .replace pass. */
export function rewriteToMarkdown(
  input: string,
  resolve: WikiResolver
): { body: string } {
  const body = input.replace(WIKILINK_RE, (_match, target, label) => {
    const classified = classifyTarget(String(target));
    const labelStr = label ? String(label).trim() : null;
    return resolve({ label: labelStr, target: classified });
  });
  return { body };
}
