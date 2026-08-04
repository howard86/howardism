/**
 * Reduce wiki/MDX markdown to clean, readable plain text — structural markup,
 * code, links and MDX module syntax stripped so a consumer sees prose rather
 * than syntax. Backs the knowledge MCP server's `knowledge_get`.
 */
import { stripToText } from "./wikilink.ts";

// The `export { default as heroImage } …` line every emitted MDX carries right
// after its frontmatter — module syntax, not prose.
const HERO_EXPORT_RE = /^export \{ default as heroImage \}[^\n]*\n?/m;

const FENCE_RE = /^(\s*)(`{3,}|~{3,})/;
// A table delimiter row like `|---|:--:|` — pipes plus only dashes/colons.
const TABLE_DIVIDER_RE = /^\s*\|?[\s:|-]+\|?\s*$/;
const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
const BLOCKQUOTE_RE = /^\s*>+\s?/;
const LIST_MARKER_RE = /^\s*(?:[-*+]|\d{1,9}[.)])\s+/;
const IMAGE_RE = /!\[([^\]]*)\]\([^)]*\)/g;
const LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const INLINE_CODE_RE = /`+([^`]*)`+/g;
// Emphasis markers we can drop without mangling identifiers — underscores are
// left alone so `snake_case` words survive as single search tokens.
const EMPHASIS_RE = /(\*+|~+)/g;
const PIPE_RE = /\|/g;
const WHITESPACE_RE = /\s+/g;

/** Markdown (post-frontmatter) → single normalized line of plain prose. */
export function toPlainText(markdown: string): string {
  const lines = stripToText(markdown.replace(HERO_EXPORT_RE, "")).split("\n");
  const out: string[] = [];
  let fenceChar: string | null = null;

  for (const line of lines) {
    const fence = FENCE_RE.exec(line);
    if (fence) {
      const marker = fence[2][0];
      if (fenceChar === null) {
        fenceChar = marker;
      } else if (marker === fenceChar) {
        fenceChar = null;
      }
      continue;
    }
    if (fenceChar !== null) {
      continue;
    }
    const cleaned = cleanLine(line);
    if (cleaned.length > 0) {
      out.push(cleaned);
    }
  }

  return out.join(" ").replace(WHITESPACE_RE, " ").trim();
}

function cleanLine(line: string): string {
  if (line.includes("|") && TABLE_DIVIDER_RE.test(line)) {
    return "";
  }
  return line
    .replace(HEADING_RE, "")
    .replace(BLOCKQUOTE_RE, "")
    .replace(LIST_MARKER_RE, "")
    .replace(IMAGE_RE, "$1")
    .replace(LINK_RE, "$1")
    .replace(INLINE_CODE_RE, "$1")
    .replace(EMPHASIS_RE, "")
    .replace(PIPE_RE, " ")
    .trim();
}
