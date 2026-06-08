import type { SourceRef } from "@howardism/article-contract";

import type { RawDoc } from "./parse.ts";
import {
  humanize,
  rewriteToMarkdown,
  titleFromSlug,
  type WikiResolver,
} from "./wikilink.ts";

// Accepts both `[[target|label]]` and `[[target\|label]]` — the latter is the
// Obsidian convention for embedding pipes inside markdown tables.
const FENCE_RE = /^(\s*)(```+|~~~+)/;
const WORD_RE = /\b\w+\b/g;
const LEADING_H1_RE = /^#\s+.+\n+/;
const TRAILING_PUNCT_RE = /[.\s]+$/;
const FIRST_PARAGRAPH_SKIP_RE = /^(#|>|\||-|\*|`{3}|~{3}|<!--)/;
const BLOCKQUOTE_PREFIX_RE = /^>\s?/;
const BOLD_MARKER_RE = /\*\*([^*]+)\*\*/g;
const FENCE_START_RE = /^(```+|~~~+)/;
const LEADING_BLANKS_RE = /^\s*\n+/;
const LEADING_HASH_RE = /^#\s+/;
const WHITESPACE_RE = /\s+/g;
// Obsidian convention: a leading `_Entity._` (or `*Entity.*`) marker on the
// first prose line signals that the article documents a named real-world
// entity rather than an abstract concept. Both delimiter styles are valid
// emphasis in commonmark, so authors use whichever they prefer.
const ENTITY_PREFIX_RE = /^(?:_Entity\._|\*Entity\.\*)\s*/;
const WORDS_PER_MINUTE = 200;
const MAX_DESCRIPTION_CHARS = 200;

// Patterns that point at the local Obsidian vault or filesystem layout. They
// leak the author's directory structure (vault root, raw/ staging, derived/
// outputs) into the public blog and should be scrubbed before emit.
const VAULT_PATH_REDACTIONS: Array<readonly [RegExp, string]> = [
  // Obsidian vault root, anywhere it appears (with or without backticks)
  [/`obsidian-vault\/[^`]+`/g, ""],
  [/\bobsidian-vault\/[\w./-]+/g, ""],
  // Vault `raw/` asset references — file-specific, no public meaning
  [/`raw\/assets\/[^`]+`/g, ""],
  [/\braw\/assets\/[\w./-]+/g, ""],
  // Vault-internal directories and well-known files
  [/`wiki\/derived\/?`/g, "derived"],
  [/\bwiki\/derived\/?/g, "derived"],
  [/`wiki\/raw\/?`/g, "raw"],
  [/`wiki\/index\.md`/g, "the index"],
  [/`wiki\/log\.md`/g, "the log"],
  [/\bwiki\/index\.md\b/g, "the index"],
  [/\bwiki\/log\.md\b/g, "the log"],
];

// Order matters: the preposition-drop rules ("saved at", "from", "in", "at")
// must run BEFORE the generic space-before-punctuation collapse. Otherwise
// "saved at ." would collapse to "saved at." instead of "saved." — the
// orphan preposition reads worse than the original.
const REDACTION_CLEANUP: Array<readonly [RegExp, string]> = [
  [/\bsaved at\s+for\b/g, "saved for"],
  [/\bsaved at\s*([.,;])/g, "saved$1"],
  [/\s+at\s+([.,;])/g, "$1"],
  [/\s+in\s+([.,;])/g, "$1"],
  [/\s+from\s+([.,;])/g, "$1"],
  // Anchored to a non-space char so it doesn't disturb code-block indentation.
  [/(\S)[ \t]+([.,;:!?])/g, "$1$2"],
  [/[ \t]{2,}/g, " "],
];

export interface EntityPrefixResult {
  /** Description with the leading marker (and trailing whitespace) removed. */
  description: string;
  /** True iff the input started with `_Entity._` or `*Entity.*`. */
  isEntity: boolean;
}

/**
 * Detects and strips the leading `_Entity._` / `*Entity.*` marker authors use
 * in concept-folder articles to mark them as real-world entities. The marker
 * itself is editorial noise that should never reach the rendered MDX, so we
 * always strip it; callers decide whether `isEntity === true` warrants
 * promoting the article's tag from "Concept" to "Entity".
 */
export function detectEntityPrefix(description: string): EntityPrefixResult {
  const match = ENTITY_PREFIX_RE.exec(description);
  if (!match) {
    return { description, isEntity: false };
  }
  return {
    description: description.slice(match[0].length),
    isEntity: true,
  };
}

export interface WikilinkTransformResult {
  body: string;
  hasInternalLink: boolean;
  unresolved: string[];
}

// Wikilinks that point at vault dashboards rather than emitted articles. The
// vault's `home.md` is the Obsidian "start here" index; the blog's equivalent
// landing page is `/`. Resolving these to their blog route keeps the link live
// and off the unresolved-warnings list (every MOC carries a `[[home]]`).
const KNOWN_ROUTE_LINKS: Record<string, string> = { home: "/" };

interface InternalResolution {
  /** True when the target resolved to an in-blog link (article or route). */
  internal: boolean;
  /** Markdown to emit in place of the wikilink. */
  text: string;
  /** Slug to record as unresolved, or null when the target resolved. */
  unresolvedSlug: string | null;
}

/**
 * Resolve a non-raw (`internal`) wikilink target to its emitted markdown. Pure:
 * the caller applies the `internal`/`unresolvedSlug` side-effects so the
 * resolver closure stays simple. Resolution order: same-page anchor links
 * (no slug) → known dashboard routes → in-set article slug → unresolved.
 */
function resolveInternalTarget(args: {
  anchor: string | null;
  label: string | null;
  slug: string;
  slugTitleMap: Map<string, string>;
}): InternalResolution {
  const { anchor, label, slug, slugTitleMap } = args;

  if (slug === "") {
    return {
      text: label ?? (anchor ? humanize(anchor) : ""),
      internal: false,
      unresolvedSlug: null,
    };
  }

  const route = KNOWN_ROUTE_LINKS[slug];
  if (route) {
    return {
      text: `[${label ?? titleFromSlug(slug)}](${route})`,
      internal: true,
      unresolvedSlug: null,
    };
  }

  const title = slugTitleMap.get(slug);
  if (title) {
    const fragment = anchor ? `#${encodeURIComponent(anchor)}` : "";
    return {
      text: `[${label ?? title}](/articles/${slug}${fragment})`,
      internal: true,
      unresolvedSlug: null,
    };
  }

  return {
    text: label ?? titleFromSlug(slug),
    internal: false,
    unresolvedSlug: slug,
  };
}

/**
 * Resolves Obsidian wikilinks to markdown links. Authoring convention for
 * the blog is markdown `[text](href)` — the MDX `a` component override in
 * `apps/blog/mdx-components.tsx` resolves `/articles/*` hrefs to the
 * preview-aware InternalLink at render time.
 *
 * Anchor URL fragments are URL-encoded so that spaces and other reserved
 * characters in heading anchors round-trip safely through markdown.
 *
 * When `rawIndex` is provided, `[[raw/<slug>]]` references upgrade from
 * plain humanised text to a clickable link if the corresponding raw doc
 * exposes a public URL. Without the index — or when the raw doc has no
 * URL — the original humanised-text behavior is preserved.
 */
export function rewriteWikilinks(
  body: string,
  slugTitleMap: Map<string, string>,
  rawIndex?: Map<string, RawDoc>
): WikilinkTransformResult {
  let hasInternalLink = false;
  const unresolved: string[] = [];

  const resolve: WikiResolver = ({ target, label }) => {
    if (target.kind === "raw") {
      const rawDoc = rawIndex?.get(target.rawSlug);
      const display = label ?? rawDoc?.title ?? humanize(target.rawSlug);
      return rawDoc?.url ? `[${display}](${rawDoc.url})` : display;
    }

    const res = resolveInternalTarget({
      slug: target.slug,
      anchor: target.anchor,
      label,
      slugTitleMap,
    });
    if (res.internal) {
      hasInternalLink = true;
    }
    if (res.unresolvedSlug !== null) {
      unresolved.push(res.unresolvedSlug);
    }
    return res.text;
  };

  return {
    body: rewriteToMarkdown(body, resolve).body,
    hasInternalLink,
    unresolved,
  };
}

/**
 * Renders a `## Sources` markdown section from the resolved per-article
 * source list. Bullet list, alphabetical by case-insensitive title, with
 * `[title](url)` when a public URL is known and plain title otherwise.
 *
 * Returns an empty string when the list is empty so callers can
 * unconditionally prepend without polluting source-less articles.
 */
export function buildSourcesSection(sources: readonly SourceRef[]): string {
  if (sources.length === 0) {
    return "";
  }
  const sorted = [...sources].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
  const lines = sorted.map((source) =>
    source.url ? `- [${source.title}](${source.url})` : `- ${source.title}`
  );
  return ["## Sources", "", ...lines, "", ""].join("\n");
}

/**
 * MDX treats `{` as a JS expression delimiter and `<letter` as a JSX tag
 * opener — wiki prose uses both as plain text, so escape outside fenced
 * code blocks or `next build` fails. Run BEFORE `rewriteWikilinks` so
 * the synthesised markdown links aren't accidentally escaped.
 */
export function escapeMdxBody(body: string): string {
  const lines = body.split("\n");
  let inFence = false;
  let fenceMarker: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = FENCE_RE.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[2];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0];
      } else if (marker.startsWith(fenceMarker ?? "")) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }

    if (inFence) {
      continue;
    }
    lines[i] = escapeLine(line);
  }

  return lines.join("\n");
}

function findClosingBacktickRun(rest: string, runLen: number): number {
  for (let j = 0; j <= rest.length - runLen; j++) {
    if (rest[j] !== "`") {
      continue;
    }
    let len = 0;
    while (j + len < rest.length && rest[j + len] === "`") {
      len++;
    }
    if (len === runLen) {
      return j;
    }
    j += len - 1;
  }
  return -1;
}

function consumeBacktickSpan(
  line: string,
  start: number
): { emit: string; next: number } {
  let i = start;
  while (i < line.length && line[i] === "`") {
    i++;
  }
  const openRun = i - start;
  const closeIdx = findClosingBacktickRun(line.slice(i), openRun);
  if (closeIdx === -1) {
    return { emit: line.slice(start, i), next: i };
  }
  const end = i + closeIdx + openRun;
  return { emit: line.slice(start, end), next: end };
}

/**
 * A brace is already MDX-safe when an odd number of backslashes precede it —
 * the source has escaped it itself (common in inline LaTeX like `\{...\}`).
 * Escaping again would produce `\\{`, i.e. a literal backslash plus a live
 * brace, which MDX parses as a (broken) expression.
 */
function isBraceAlreadyEscaped(line: string, i: number): boolean {
  let backslashes = 0;
  for (let j = i - 1; j >= 0 && line[j] === "\\"; j--) {
    backslashes++;
  }
  return backslashes % 2 === 1;
}

function escapeProseChar(line: string, i: number): string {
  const ch = line[i];
  if (ch === "{" || ch === "}") {
    return isBraceAlreadyEscaped(line, i) ? ch : `\\${ch}`;
  }
  if (ch === "<") {
    return "&lt;";
  }
  return ch;
}

function escapeLine(line: string): string {
  let result = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "`") {
      const { emit, next } = consumeBacktickSpan(line, i);
      result += emit;
      i = next;
      continue;
    }
    result += escapeProseChar(line, i);
    i++;
  }
  return result;
}

/**
 * The body's leading `# H1` heading text, or `""` when the body doesn't open
 * with one. MOC pages carry a `MOC — …` frontmatter title but a clean
 * `# Domain Name` body heading; the importer prefers the latter as the display
 * title so the page shows one heading (next to its `Index` badge) instead of
 * two near-identical ones.
 */
export function firstHeading(body: string): string {
  const trimmed = body.replace(LEADING_BLANKS_RE, "");
  const match = LEADING_H1_RE.exec(trimmed);
  if (!match) {
    return "";
  }
  return match[0].replace(LEADING_HASH_RE, "").trim();
}

/**
 * Drop standalone HTML comments — the vault's `<!-- BEGIN GENERATED: moc -->`
 * member-list markers and the odd author TODO note. MDX escaping would turn
 * `<!--` into a visible `&lt;!--` literal, so these author-only blocks must go
 * before escaping. Handles single- and multi-line comments that start a line;
 * each becomes one blank line so the blocks it separated keep their gap.
 */
export function stripHtmlComments(body: string): string {
  const result: string[] = [];
  let inComment = false;
  for (const line of body.split("\n")) {
    if (inComment) {
      if (line.includes("-->")) {
        inComment = false;
      }
      continue;
    }
    if (!line.trim().startsWith("<!--")) {
      result.push(line);
      continue;
    }
    result.push("");
    if (!line.includes("-->")) {
      inComment = true;
    }
  }
  return result.join("\n");
}

export function stripDuplicateLeadingHeading(
  body: string,
  title: string
): string {
  const trimmed = body.replace(LEADING_BLANKS_RE, "");
  const headingMatch = LEADING_H1_RE.exec(trimmed);
  if (!headingMatch) {
    return trimmed;
  }
  const heading = headingMatch[0].replace(LEADING_HASH_RE, "").trim();
  if (heading === title.trim()) {
    return trimmed.slice(headingMatch[0].length).replace(LEADING_BLANKS_RE, "");
  }
  return trimmed;
}

/**
 * Strips Obsidian-vault-relative paths (`obsidian-vault/...`, `raw/assets/...`,
 * `wiki/index.md`, etc.) from the body. The vault's directory layout has no
 * meaning to a public reader and leaks the author's local filesystem.
 *
 * Run AFTER `rewriteWikilinks` — wikilink targets may share the `wiki/`
 * prefix, and we don't want to scrub those before they're resolved to URLs.
 */
export function redactLocalPaths(body: string): string {
  let result = body;
  for (const [re, replacement] of VAULT_PATH_REDACTIONS) {
    result = result.replace(re, replacement);
  }
  for (const [re, replacement] of REDACTION_CLEANUP) {
    result = result.replace(re, replacement);
  }
  return result;
}

export function computeReadingTime(body: string): number {
  const wordMatches = body.match(WORD_RE);
  const wordCount = wordMatches?.length ?? 0;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/**
 * Extract the first contiguous `>` blockquote as plain text (markers and bold
 * markup stripped). MOC pages lead with a `> Map of Content…` callout that is
 * the only human-written prose before the generated member list, so it serves
 * as their description. Returns `""` when the body opens with no blockquote.
 */
export function firstBlockquote(body: string): string {
  const lines: string[] = [];
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith(">")) {
      lines.push(line.replace(BLOCKQUOTE_PREFIX_RE, ""));
    } else if (lines.length > 0) {
      break;
    }
  }
  return lines
    .join(" ")
    .replace(BOLD_MARKER_RE, "$1")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

export function firstParagraph(body: string): string {
  const paragraph = collectFirstParagraph(body);
  const joined = paragraph.join(" ").replace(WHITESPACE_RE, " ").trim();
  if (joined.length <= MAX_DESCRIPTION_CHARS) {
    return joined;
  }
  const truncated = joined.slice(0, MAX_DESCRIPTION_CHARS);
  const lastSpace = truncated.lastIndexOf(" ");
  const safe = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${safe.replace(TRAILING_PUNCT_RE, "")}…`;
}

interface FenceState {
  fenceChar: string | null;
  inFence: boolean;
}

function collectFirstParagraph(body: string): string[] {
  const paragraph: string[] = [];
  const fence: FenceState = { inFence: false, fenceChar: null };

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (updateFenceState(line, fence)) {
      if (paragraph.length > 0) {
        return paragraph;
      }
      continue;
    }
    if (fence.inFence) {
      continue;
    }
    if (shouldSkipParagraphLine(line)) {
      if (paragraph.length > 0) {
        return paragraph;
      }
      continue;
    }
    paragraph.push(line);
  }
  return paragraph;
}

function updateFenceState(line: string, state: FenceState): boolean {
  const match = FENCE_START_RE.exec(line);
  if (!match) {
    return false;
  }
  const marker = match[1][0];
  if (!state.inFence) {
    state.inFence = true;
    state.fenceChar = marker;
  } else if (marker === state.fenceChar) {
    state.inFence = false;
    state.fenceChar = null;
  }
  return true;
}

function shouldSkipParagraphLine(line: string): boolean {
  return line.length === 0 || FIRST_PARAGRAPH_SKIP_RE.test(line);
}
