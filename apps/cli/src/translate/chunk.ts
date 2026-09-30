/**
 * Split an over-ceiling article into parts that each fit the structured
 * single-turn path, and stitch the translated parts back together.
 *
 * Invariant: `chunkArticle(text).join("") === text`. Every split point sits at
 * the start of a non-blank line, so a part only ever ends in the source's own
 * boundary whitespace — {@link reassembleChunks} re-uses that whitespace
 * instead of trusting the model's, which is what makes a pass-through
 * round-trip byte-identical.
 */

/**
 * Target size per part, in bytes. The structured ceiling
 * (`STRUCTURED_MAX_SOURCE_BYTES`, 60KB) is the envelope single-turn mode is
 * proven in; 40KB leaves a third of it as headroom for what the target cannot
 * bound — part 1 also carries the frontmatter, and a single `## ` section or
 * paragraph that cannot be split further is kept whole even when it overshoots.
 */
export const CHUNK_TARGET_BYTES = 40_000;

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const FENCE_RE = /^\s*(`{3,}|~{3,})/;
const H2_RE = /^## /;
const BLANK_RE = /^\s*$/;
const DISPLAY_MATH_FENCE_RE = /^\s*\$\$\s*$/;
const JSX_CLOSE_RE = /^<\/[A-Za-z][\w.:-]*\s*>/;
const JSX_OPEN_RE = /^<([A-Za-z][\w.:-]*)/;
const TRAILING_WS_RE = /\s*$/;
const LEADING_BLANK_LINES_RE = /^(?:[ \t]*\r?\n)+/;

/** HTML void elements: an unclosed `<br>` must not open a JSX block forever. */
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const byteLength = (text: string): number => Buffer.byteLength(text, "utf8");

/** Where a line may start a new part, if anywhere. */
type Boundary = "heading" | "paragraph" | null;

/**
 * Classify each line of `body` as a legal split point. A split is never taken
 * inside a fenced code block, a `$$` display-math block, or a multi-line
 * MDX/JSX element; a table needs no tracking, since a blank line always ends
 * one and paragraph splits only happen after a blank line.
 */
function classifyBoundaries(lines: string[]): Boundary[] {
  const state = new BlockState();
  return lines.map((line, i) => {
    const boundary = state.isOutside() && i > 0 ? boundaryAt(lines, i) : null;
    state.advance(line);
    return boundary;
  });
}

/** Split kind a line would start, ignoring block state. */
function boundaryAt(lines: string[], i: number): Boundary {
  const line = lines[i];
  if (H2_RE.test(line)) {
    return "heading";
  }
  return !BLANK_RE.test(line) && BLANK_RE.test(lines[i - 1])
    ? "paragraph"
    : null;
}

/** Line-by-line tracker of the blocks a split must not land inside. */
class BlockState {
  private fence: string | null;
  private inMath: boolean;
  private jsxDepth: number;
  private inOpenTag: boolean;

  constructor() {
    this.fence = null;
    this.inMath = false;
    this.jsxDepth = 0;
    this.inOpenTag = false;
  }

  isOutside(): boolean {
    return (
      this.fence === null &&
      !this.inMath &&
      this.jsxDepth === 0 &&
      !this.inOpenTag
    );
  }

  /** Update the state with `line`, which has already been classified. */
  advance(line: string): void {
    const fenceMatch = line.match(FENCE_RE);
    if (fenceMatch) {
      this.toggleFence(fenceMatch[1]);
      return;
    }
    if (this.fence !== null) {
      return;
    }
    if (DISPLAY_MATH_FENCE_RE.test(line)) {
      this.inMath = !this.inMath;
      return;
    }
    if (!this.inMath) {
      this.advanceJsx(line.trim());
    }
  }

  private toggleFence(marker: string): void {
    if (this.fence === null) {
      this.fence = marker;
    } else if (
      marker[0] === this.fence[0] &&
      marker.length >= this.fence.length
    ) {
      this.fence = null;
    }
  }

  private advanceJsx(trimmed: string): void {
    if (this.inOpenTag) {
      // A multi-line opening tag ends at its first `>`.
      if (trimmed.includes(">")) {
        this.inOpenTag = false;
        this.jsxDepth += trimmed.endsWith("/>") ? 0 : 1;
      }
      return;
    }
    if (JSX_CLOSE_RE.test(trimmed)) {
      this.jsxDepth = Math.max(0, this.jsxDepth - 1);
      return;
    }
    const open = trimmed.match(JSX_OPEN_RE);
    if (!open || VOID_ELEMENTS.has(open[1].toLowerCase())) {
      return;
    }
    const [, name] = open;
    if (!trimmed.includes(">")) {
      this.inOpenTag = true;
    } else if (!(trimmed.endsWith("/>") || trimmed.includes(`</${name}`))) {
      this.jsxDepth += 1;
    }
  }
}

/** Cut `lines` before every index where `isCut` holds; segments keep their `\n`s. */
function cutLines(
  lines: string[],
  isCut: (index: number) => boolean
): string[] {
  const segments: string[] = [];
  let start = 0;
  for (let i = 1; i < lines.length; i += 1) {
    if (isCut(i)) {
      segments.push(lines.slice(start, i).join("\n"));
      start = i;
    }
  }
  segments.push(lines.slice(start).join("\n"));
  // `join("\n")` drops the newline between segments; put it back on each
  // segment but the last so the pieces still concatenate to the input.
  return segments.map((segment, i) =>
    i < segments.length - 1 ? `${segment}\n` : segment
  );
}

/** Greedily pack consecutive segments into parts of at most `targetBytes`. */
function pack(segments: string[], targetBytes: number): string[] {
  const parts: string[] = [];
  let current = "";
  for (const segment of segments) {
    if (current !== "" && byteLength(current + segment) > targetBytes) {
      parts.push(current);
      current = "";
    }
    current += segment;
  }
  if (current !== "") {
    parts.push(current);
  }
  return parts;
}

/**
 * Split a full MDX source into parts of roughly `targetBytes`, in order, whose
 * concatenation is exactly `sourceText`. Part 1 carries the whole frontmatter
 * (so it is translated once, with its heroImage line and intro). The body is
 * cut at `## ` headings; a section still above the target is cut further at
 * blank-line paragraph boundaries. A single paragraph above the target is left
 * whole — splitting mid-paragraph would break the prose it is meant to keep.
 */
export function chunkArticle(
  sourceText: string,
  targetBytes: number = CHUNK_TARGET_BYTES
): string[] {
  const head = sourceText.match(FRONTMATTER_RE)?.[0] ?? "";
  const lines = sourceText.slice(head.length).split("\n");
  const boundaries = classifyBoundaries(lines);

  // Section = run of lines up to the next legal `## ` split.
  const sectionStarts: number[] = [0];
  for (let i = 1; i < lines.length; i += 1) {
    if (boundaries[i] === "heading") {
      sectionStarts.push(i);
    }
  }
  const segments: string[] = [];
  for (let s = 0; s < sectionStarts.length; s += 1) {
    const from = sectionStarts[s];
    const to = sectionStarts[s + 1] ?? lines.length;
    const sectionLines = lines.slice(from, to);
    // Rejoin with the trailing newline the cut consumed (every section but
    // the last ended before another line).
    const section = sectionLines.join("\n") + (to < lines.length ? "\n" : "");
    const budget = s === 0 ? targetBytes - byteLength(head) : targetBytes;
    if (byteLength(section) <= budget) {
      segments.push(section);
      continue;
    }
    const paragraphs = cutLines(
      sectionLines,
      (i) => boundaries[from + i] === "paragraph"
    );
    if (to < lines.length) {
      paragraphs[paragraphs.length - 1] += "\n";
    }
    segments.push(...paragraphs);
  }
  segments[0] = head + segments[0];
  return pack(segments, targetBytes);
}

/**
 * Concatenate translated parts in order. Each part keeps its translated text
 * minus the model's own leading blank lines and trailing whitespace, and gets
 * the source part's trailing whitespace instead — so paragraph spacing at the
 * seams is the source's, and a pass-through reassembles byte-identically.
 */
export function reassembleChunks(
  sourceChunks: string[],
  translatedChunks: string[]
): string {
  if (sourceChunks.length !== translatedChunks.length) {
    throw new Error(
      `reassembleChunks: ${translatedChunks.length} translated parts for ${sourceChunks.length} source parts`
    );
  }
  return translatedChunks
    .map((translated, i) => {
      const sourceTail = sourceChunks[i].match(TRAILING_WS_RE)?.[0] ?? "";
      return (
        translated.replace(LEADING_BLANK_LINES_RE, "").trimEnd() + sourceTail
      );
    })
    .join("");
}
