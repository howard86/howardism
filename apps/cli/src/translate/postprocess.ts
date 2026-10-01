import matter from "gray-matter";

/**
 * Deterministic, engine-independent post-processor for translated MDX.
 * Fixes MDX-breaking character patterns that LLMs introduce when they
 * "correct" escaping conventions the source uses for MDX compatibility:
 *
 * 1. Unescaped `{` / `}` in body prose → `\{` / `\}`.
 *    MDX parses bare `{...}` as JSX expressions; source articles use `\{`
 *    inside LaTeX so the parser skips them. LLMs often un-escape them.
 *
 *    Engines also emit `\\{` (an escaped backslash, then a bare brace — an
 *    MDX expression), so a run of backslashes before `{`, `}` or `|` is first
 *    collapsed to one. The English corpus never contains a literal `\\`.
 *
 * 2. `<` before a digit or `$` → `&lt;`.
 *    MDX/acorn tries to parse `<5%` or `<$50` as a JSX opening tag and
 *    fails. Source articles use `&lt;5%` etc. LLMs sometimes write bare `<`.
 *
 * Scope: **body prose only** — frontmatter, export/import lines, fenced
 * code blocks, and inline code spans are left byte-identical.
 * The function is pure and idempotent: running it twice equals running once.
 */

/** Fence line: up to 3 leading spaces then 3+ backticks or 3+ tildes. */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

/** Capture groups split a line on single-backtick inline code spans. */
const CODE_SPAN_RE = /(`[^`]*`)/;

const fenceMarkerOf = (line: string): string | null => {
  const m = line.match(FENCE_RE);
  return m ? ((m[1] ?? "")[0] ?? null) : null;
};

const toggleFence = (current: string | null, marker: string): string | null => {
  if (current === null) {
    return marker;
  }
  if (current === marker) {
    return null;
  }
  return current;
};

/**
 * Split a prose line into alternating [prose, code-span, prose, …] segments
 * using single-backtick inline code spans. Odd-indexed segments are code
 * spans and must not be modified.
 */
const splitOnCodeSpans = (line: string): string[] => line.split(CODE_SPAN_RE);

/** A line with none of these can never be changed by fixSegment/splitOnCodeSpans. */
const FIXABLE_CHAR_RE = /[{}<`\\]/;

/**
 * Apply MDX-escaping fixes to a single prose segment (no backtick content).
 * `(?<!\\)` lookbehinds ensure already-escaped sequences are not doubled.
 */
const fixSegment = (seg: string): string =>
  seg
    .replace(/\\{2,}(?=[{}|])/g, "\\")
    .replace(/(?<!\\)\{/g, "\\{")
    .replace(/(?<!\\)\}/g, "\\}")
    .replace(/<(?=[0-9$])/g, "&lt;");

const fixProseLine = (line: string): string => {
  if (!FIXABLE_CHAR_RE.test(line)) {
    return line;
  }
  return splitOnCodeSpans(line)
    .map((part, i) => (i % 2 === 0 ? fixSegment(part) : part))
    .join("");
};

interface FrontmatterState {
  frontmatterDone: boolean;
  inFrontmatter: boolean;
}

/**
 * Advance frontmatter state for `line` at `index`.
 * Returns true when the line is inside (or is a delimiter of) the frontmatter
 * block and should be left untouched.
 */
const advanceFrontmatter = (
  line: string,
  index: number,
  state: FrontmatterState
): boolean => {
  if (state.frontmatterDone) {
    return false;
  }
  if (index === 0 && line === "---") {
    state.inFrontmatter = true;
    return true;
  }
  if (!state.inFrontmatter) {
    return false;
  }
  if (line === "---") {
    state.inFrontmatter = false;
    state.frontmatterDone = true;
  }
  return true;
};

/**
 * Fix MDX-breaking characters in translated MDX content. Pure, idempotent.
 *
 * Rules:
 * - Frontmatter (`---` ... `---`) is never altered.
 * - Export / import lines (starting with `export ` or `import `) are never
 *   altered — the `export { default as heroImage }` line uses real JS syntax.
 * - Lines inside fenced code blocks (``` or ~~~) are never altered.
 * - Inline code spans within a prose line are never altered.
 * - All other body lines have unescaped `{`/`}` escaped to `\{`/`\}` and
 *   bare `<` before a digit or `$` replaced with `&lt;`.
 *
 * @param text raw translated MDX content
 * @returns the same content with MDX-safe escaping applied
 */
export function fixMdxEscaping(text: string): string {
  const lines = text.split("\n");
  let fenceMarker: string | null = null;
  const fmState: FrontmatterState = {
    inFrontmatter: false,
    frontmatterDone: false,
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const hadCR = raw.endsWith("\r");
    const line = hadCR ? raw.slice(0, -1) : raw;

    if (advanceFrontmatter(line, i, fmState)) {
      continue;
    }

    if (line.startsWith("export ") || line.startsWith("import ")) {
      continue;
    }

    const marker = fenceMarkerOf(line);
    if (marker !== null) {
      fenceMarker = toggleFence(fenceMarker, marker);
      continue;
    }
    if (fenceMarker !== null) {
      continue;
    }

    const fixed = fixProseLine(line);
    if (fixed !== line) {
      lines[i] = `${fixed}${hadCR ? "\r" : ""}`;
    }
  }

  return lines.join("\n");
}

/** Frontmatter keys the engine translates (see prompt.ts); all others are verbatim. */
const TRANSLATED_FRONTMATTER_KEYS = ["title", "description", "imageAlt"];

/** A value already quoted or a block scalar: left for validation to judge. */
const QUOTED_OR_BLOCK_RE = /^["'|>]/;

/** A plain scalar's continuation line; a column-0 line is the next key. */
const INDENTED_LINE_RE = /^\s+\S/;

/** Top-level article frontmatter keys (translated + verbatim, see prompt.ts). */
const TOP_LEVEL_KEYS = [
  ...TRANSLATED_FRONTMATTER_KEYS,
  "date",
  "domain",
  "readingTime",
  "sources",
  "tag",
  "tags",
  "topic",
];

/** `  key:` for a known top-level key — the engine sometimes indents one. */
const isStrayIndentedKey = (line: string): boolean =>
  INDENTED_LINE_RE.test(line) &&
  TOP_LEVEL_KEYS.some((k) => line.trimStart().startsWith(`${k}:`));

/** A one-line `key: value` entry: nothing indented may legitimately follow it but a continuation. */
const SCALAR_ENTRY_RE = /^[A-Za-z][\w-]*:\s+\S/;

const parsesAsFrontmatter = (text: string): boolean => {
  try {
    // `{}` opts out of gray-matter's global cache.
    matter(text, {});
    return true;
  } catch {
    return false;
  }
};

/**
 * Join a plain scalar's first line with its indented continuation lines,
 * stopping at an indented top-level key. Returns the folded value and the index of the
 * first line not consumed.
 */
const foldPlainScalar = (
  lines: string[],
  start: number,
  end: number,
  first: string
): { next: number; value: string } => {
  const parts = [first];
  let i = start;
  while (
    i < end &&
    INDENTED_LINE_RE.test(lines[i] ?? "") &&
    !isStrayIndentedKey(lines[i] ?? "")
  ) {
    parts.push((lines[i] ?? "").trim());
    i += 1;
  }
  return { next: i, value: parts.filter(Boolean).join(" ") };
};

/** True when a translated key present in `block` is no longer a string after repair. */
const losesTranslatedKey = (block: string[], repaired: string): boolean => {
  const { data } = matter(repaired, {});
  return TRANSLATED_FRONTMATTER_KEYS.some(
    (k) =>
      block.some((l) => l.trimStart().startsWith(`${k}:`)) &&
      typeof data[k] !== "string"
  );
};

/**
 * Re-quote translated frontmatter values that no longer parse as YAML. Source
 * `description`s are unquoted plain scalars folded over several lines; a
 * translation that gains a `: ` (or a leading quote) turns the continuation
 * into a bogus mapping entry, and the engine repeats the same mistake on retry
 * ("bad indentation of a mapping entry"). Each plain `title`/`description`/
 * `imageAlt` value is folded onto one line — the same space-joining YAML
 * applies to a plain scalar — and re-emitted as a JSON string, which is a valid
 * YAML double-quoted scalar. Pure: returns `text` unchanged when it already
 * parses, and when the repair would not make it parse either (validation then
 * reports the original error).
 */
export function repairTranslatedFrontmatter(text: string): string {
  if (!text.startsWith("---") || parsesAsFrontmatter(text)) {
    return text;
  }
  const lines = text.split("\n");
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    return text;
  }
  const out: string[] = [lines[0] ?? "---"];
  let i = 1;
  while (i < end) {
    const raw = lines[i] ?? "";
    // ` description: …` after a scalar entry is an indented top-level key, not a
    // continuation — folding it in would silently drop the key.
    const line =
      isStrayIndentedKey(raw) && SCALAR_ENTRY_RE.test(out.at(-1) ?? "")
        ? raw.trimStart()
        : raw;
    const key = TRANSLATED_FRONTMATTER_KEYS.find((k) =>
      line.startsWith(`${k}:`)
    );
    const first = key ? line.slice(key.length + 1).trim() : "";
    if (!key || QUOTED_OR_BLOCK_RE.test(first)) {
      out.push(line);
      i += 1;
      continue;
    }
    const folded = foldPlainScalar(lines, i + 1, end, first);
    out.push(`${key}: ${JSON.stringify(folded.value)}`);
    i = folded.next;
  }
  const repaired = [...out, ...lines.slice(end)].join("\n");
  if (!parsesAsFrontmatter(repaired)) {
    return text;
  }
  // Never trade a parse error for a silently lost translated key.
  return losesTranslatedKey(lines.slice(1, end), repaired) ? text : repaired;
}
