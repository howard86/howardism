/**
 * Deterministic, engine-independent post-processor for translated MDX.
 * Fixes MDX-breaking character patterns that LLMs introduce when they
 * "correct" escaping conventions the source uses for MDX compatibility:
 *
 * 1. Unescaped `{` / `}` in body prose → `\{` / `\}`.
 *    MDX parses bare `{...}` as JSX expressions; source articles use `\{`
 *    inside LaTeX so the parser skips them. LLMs often un-escape them.
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

/**
 * Apply MDX-escaping fixes to a single prose segment (no backtick content).
 * `(?<!\\)` lookbehinds ensure already-escaped sequences are not doubled.
 */
const fixSegment = (seg: string): string =>
  seg
    .replace(/(?<!\\)\{/g, "\\{")
    .replace(/(?<!\\)\}/g, "\\}")
    .replace(/<(?=[0-9$])/g, "&lt;");

const fixProseLine = (line: string): string =>
  splitOnCodeSpans(line)
    .map((part, i) => (i % 2 === 0 ? fixSegment(part) : part))
    .join("");

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
