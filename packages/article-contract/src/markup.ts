/**
 * The inline-markup subset that survives the trip from the vault to a manifest
 * string, and the parser that turns it into segments the blog can render.
 *
 * Manifest strings are single-line prose harvested out of note bodies, so they
 * carry inline markdown — emphasis, code spans, links — but never block
 * structure. Parsing them here, once, keeps the blog from shipping a markdown
 * engine and keeps both sides of the contract agreeing on what a question
 * says versus how it is marked up.
 */

export type InlineSegment =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; children: InlineSegment[] }
  | { kind: "em"; children: InlineSegment[] }
  | { kind: "link"; href: string; children: InlineSegment[] };

/**
 * Alternation order is the grammar. `[text](href)` is tried before `[[wikilink]]`
 * so a resolved link wins, and `**strong**` before `*em*` so a bold run is never
 * read as an empty italic. Anything unmatched stays literal text.
 *
 * Emphasis bodies are lazy and unrestricted because they nest: the vault writes
 * `**bold with *italic* inside**` and `*(an aside with a [[wikilink]])*`, and a
 * body that refused to contain markers would leave that inner markup to leak
 * through as raw characters. Code spans are the exception — their content is
 * literal by definition and is never re-parsed.
 */
const INLINE_RE =
  /\[([^\]\n]+)\]\(([^)\s]+)\)|\[\[([^\]\n]+)\]\]|\*\*([^\n]+?)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;

const HUMANIZE_RE = /[._-]+/g;
const WHITESPACE_RE = /\s+/g;
/** Obsidian writes an alias as `target|label`, table-escaped as `target\|label`. */
const WIKILINK_ALIAS_RE = /\\?\|/;

/**
 * Emphasis nests, so parsing recurses. Each level strips its own delimiters and
 * is therefore strictly shorter than its parent, which already terminates; the
 * cap is a cheap backstop against pathological input, not a real limit — the
 * vault's deepest observed nesting is two.
 */
const MAX_DEPTH = 4;

/** Title-case a hyphenated slug. The one implementation; the CLI imports it. */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * Display text for a wikilink the importer did not resolve. A manifest written
 * before the importer rewrote its links still carries raw `[[target]]`, so the
 * parser renders it readable rather than leaking brackets — but as plain text,
 * never a link: only the importer knows which slugs are actually published.
 */
function wikilinkText(target: string): string {
  const [rawTarget, label] = target.split(WIKILINK_ALIAS_RE, 2);
  if (label) {
    return label.trim();
  }
  const bare = rawTarget.split("/").pop() ?? rawTarget;
  const slug = (bare.split("#")[0] ?? bare).trim();
  if (slug === "") {
    return bare.trim();
  }
  return rawTarget.startsWith("raw/")
    ? slug.replace(HUMANIZE_RE, " ").replace(WHITESPACE_RE, " ").trim()
    : titleFromSlug(slug.toLowerCase());
}

function parseAt(input: string, depth: number): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;

  const pushText = (text: string) => {
    if (text.length === 0) {
      return;
    }
    const last = segments.at(-1);
    if (last?.kind === "text") {
      last.text += text;
      return;
    }
    segments.push({ kind: "text", text });
  };

  // A nested body is re-parsed, so its markers never reach the reader; at the
  // depth cap it is kept as literal text instead of recursing further.
  const inner = (body: string): InlineSegment[] =>
    depth >= MAX_DEPTH
      ? [{ kind: "text", text: body }]
      : parseAt(body, depth + 1);

  // `exec` on a /g regex is stateful, so each scan owns its own instance.
  const scanner = new RegExp(INLINE_RE.source, "g");
  let match = scanner.exec(input);
  while (match !== null) {
    pushText(input.slice(cursor, match.index));
    const [whole, linkText, href, wikiTarget, strong, em, code] = match;

    if (linkText !== undefined && href !== undefined) {
      segments.push({ kind: "link", href, children: inner(linkText) });
    } else if (wikiTarget !== undefined) {
      pushText(wikilinkText(wikiTarget));
    } else if (strong !== undefined) {
      segments.push({ kind: "strong", children: inner(strong) });
    } else if (em !== undefined) {
      segments.push({ kind: "em", children: inner(em) });
    } else if (code !== undefined) {
      segments.push({ kind: "code", text: code });
    }

    cursor = match.index + whole.length;
    match = scanner.exec(input);
  }
  pushText(input.slice(cursor));

  return segments;
}

/** Split one line of manifest prose into renderable inline segments. */
export function parseInline(input: string): InlineSegment[] {
  return parseAt(input, 0);
}

/**
 * The prose a reader actually sees, with every marker removed. This is what
 * search should match against — typing "normalized" must find a question that
 * writes it as `**normalized**`, and typing "*" must not match every emphasis.
 */
export function segmentsToText(segments: readonly InlineSegment[]): string {
  let text = "";
  for (const segment of segments) {
    text +=
      segment.kind === "text" || segment.kind === "code"
        ? segment.text
        : segmentsToText(segment.children);
  }
  return text;
}
