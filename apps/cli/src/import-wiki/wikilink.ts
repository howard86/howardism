import { titleFromSlug } from "@howardism/article-contract/markup";

/** Single source of truth for the [[wikilink]] grammar.
 *  Group 1 = target (incl. any wiki/ or raw/ prefix and #anchor).
 *  Group 2 = optional label, after `|` or Obsidian's table-escaped `\|`.
 *  Newlines are excluded from both so an unclosed `[[` — the vault's generated
 *  digests truncate mid-link — simply fails to match instead of swallowing
 *  every following line up to the next `]]` anywhere in the file. */
const WIKILINK_RE = /\[\[([^\]|\\\n]+)(?:\\?\|([^\]\n]+))?\]\]/g;

/** Fenced blocks (``` / ~~~) and inline code spans, in one alternation.
 *  Inline spans are line-scoped: an unclosed backtick must not swallow the
 *  rest of the file. `\1` makes a run of N backticks close only on N. */
const CODE_REGION_RE =
  /^[ \t]*(?:```|~~~)[^\n]*\n[\s\S]*?^[ \t]*(?:```|~~~)[^\n]*$|(`+)(?:(?!\1)[^\n])+?\1/gm;
const FENCE_LINE_RE = /^[ \t]*(?:```|~~~)/;

const HUMANIZE_RE = /[._-]+/g;
const WHITESPACE_RE = /\s+/g;

/**
 * Split `input` at code-region boundaries and yield only the prose between
 * them. The vault documents its own link grammar in prose — `` `[[raw/...]]` ``
 * — and resolving those turns a quoted pattern into a broken link (or, worse,
 * a real one plus a phantom backlink in the graph).
 */
function* proseSegments(input: string): Generator<string> {
  let last = 0;
  for (const match of input.matchAll(CODE_REGION_RE)) {
    yield input.slice(last, match.index);
    last = match.index + match[0].length;
  }
  yield input.slice(last);
}

/** Rewrite the prose between code regions, leaving code byte-identical. */
function replaceOutsideCode(
  input: string,
  replace: (segment: string) => string
): string {
  let out = "";
  let last = 0;
  for (const match of input.matchAll(CODE_REGION_RE)) {
    out += replace(input.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return out + replace(input.slice(last));
}

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

/** Scan once; classify every match. Source order. No dedup. */
export function tokenizeWikilinks(input: string): WikiToken[] {
  const tokens: WikiToken[] = [];
  for (const segment of proseSegments(input)) {
    for (const match of segment.matchAll(WIKILINK_RE)) {
      const target = match[1];
      const label = match[2] ? match[2].trim() : null;
      tokens.push({ label, target: classifyTarget(target) });
    }
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
  for (const segment of proseSegments(input)) {
    for (const match of segment.matchAll(WIKILINK_RE)) {
      const target = match[1];
      if (target.startsWith("raw/")) {
        continue;
      }
      const bare = target.split("/").pop();
      if (!bare) {
        continue;
      }
      const hash = bare.indexOf("#");
      const slug = (hash >= 0 ? bare.slice(0, hash) : bare)
        .trim()
        .toLowerCase();
      if (seen) {
        if (seen.has(slug)) {
          continue;
        }
        seen.add(slug);
      }
      slugs.push(slug);
    }
  }
  return slugs;
}

/**
 * Below this, the citing line is a bare index entry (`- [[foo]]`, a MOC table
 * row) with no prose worth quoting — the backlink shows the target's own
 * description instead.
 */
const MIN_CONTEXT_CHARS = 60;
const MAX_CONTEXT_CHARS = 100;

const HEADING_MARKER_RE = /^#{1,6}\s+/;
const LIST_MARKER_RE = /^[>\s]*(?:[-*+]|\d+\.)\s+/;
const MD_LINK_RE = /\[([^\]]+)\]\([^)]*\)/g;
const TABLE_CELL_RE = /\s*\\?\|\s*/g;
const EMPHASIS_RE = /[*`]+/g;
const TRIM_SEPARATORS_RE = /^[·\s]+|[·\s]+$/g;

export interface LinkOccurrence {
  /** The citing line as plain text, or null when it carries no real prose. */
  context: string | null;
  /** How many times this body links the target. */
  count: number;
  slug: string;
}

/**
 * Internal links with their repeat count and the best line they appear in —
 * one entry per distinct target. "Best" is the longest qualifying line, which
 * favours prose over the bare list entries a target usually also appears in.
 */
export function extractLinkOccurrences(input: string): LinkOccurrence[] {
  const byTarget = new Map<string, LinkOccurrence>();
  let inFence = false;
  for (const line of input.split("\n")) {
    if (FENCE_LINE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const slugs = extractInternalSlugs(line);
    if (slugs.length === 0) {
      continue;
    }
    const context = lineContext(line);
    for (const slug of slugs) {
      const existing = byTarget.get(slug);
      if (!existing) {
        byTarget.set(slug, { slug, count: 1, context });
        continue;
      }
      existing.count += 1;
      if (
        context &&
        (existing.context === null || context.length > existing.context.length)
      ) {
        existing.context = context;
      }
    }
  }
  return [...byTarget.values()];
}

function lineContext(line: string): string | null {
  const text = stripToText(line)
    .replace(HEADING_MARKER_RE, "")
    .replace(LIST_MARKER_RE, "")
    .replace(MD_LINK_RE, "$1")
    .replace(TABLE_CELL_RE, " · ")
    .replace(EMPHASIS_RE, "")
    .replace(WHITESPACE_RE, " ")
    .replace(TRIM_SEPARATORS_RE, "");
  if (text.length < MIN_CONTEXT_CHARS) {
    return null;
  }
  if (text.length <= MAX_CONTEXT_CHARS) {
    return text;
  }
  const cut = text.slice(0, MAX_CONTEXT_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  const clipped =
    lastSpace > MAX_CONTEXT_CHARS / 2 ? cut.slice(0, lastSpace) : cut;
  return `${clipped.trimEnd()}…`;
}

/** Raw slugs (kind==="raw"), source order, ORIGINAL case + sub-paths. */
export function extractRawSlugs(
  input: string,
  opts?: { dedup?: boolean }
): string[] {
  const slugs: string[] = [];
  const seen = opts?.dedup ? new Set<string>() : null;
  for (const segment of proseSegments(input)) {
    for (const match of segment.matchAll(WIKILINK_RE)) {
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
  }
  return slugs;
}

/** Replace each wikilink with its plain-text display form. Single-pass. */
export function stripToText(input: string): string {
  return replaceOutsideCode(input, (segment) =>
    segment.replace(WIKILINK_RE, (_match, target, label) => {
      if (label) {
        return String(label).trim();
      }
      const path = String(target);
      const slug = path.split("/").pop() ?? path;
      if (path.startsWith("raw/")) {
        return humanize(slug);
      }
      return titleFromSlug(slug);
    })
  );
}

export type WikiResolver = (token: WikiToken) => string;

/** Replace each wikilink via the injected resolver. Single .replace pass. */
export function rewriteToMarkdown(
  input: string,
  resolve: WikiResolver
): { body: string } {
  const body = replaceOutsideCode(input, (segment) =>
    segment.replace(WIKILINK_RE, (_match, target, label) => {
      const classified = classifyTarget(String(target));
      const labelStr = label ? String(label).trim() : null;
      return resolve({ label: labelStr, target: classified });
    })
  );
  return { body };
}
