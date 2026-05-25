/**
 * Deterministic, engine-independent post-processor that rewrites recurring
 * STRUCTURAL section headings (e.g. `## Sources`, `### Open Questions`) to a
 * single canonical Traditional Chinese form. Runs in the orchestrator after
 * the engine writes its output and before contract validation, so every
 * produced file ends up with consistent section titles regardless of which
 * engine generated it — or how that engine chose to render the heading.
 */

/**
 * Canonical zh-TW heading + every form that should collapse to it. Engines are
 * told to translate body headings, so the SAME structural section arrives as
 * the original English (`Sources`), the canonical zh-TW (`資料來源`), or a
 * looser zh-TW variant the model picked (`來源`). All of them — plus the
 * canonical itself, which keeps the pass idempotent — map to one canonical
 * string. Aliases are limited to forms actually observed in the corpus so a
 * genuine content heading never collides with a structural one.
 */
const HEADING_GROUPS: { aliases: string[]; canonical: string }[] = [
  {
    canonical: "資料來源",
    aliases: ["sources", "來源", "資料來源", "參考資料"],
  },
  {
    canonical: "相關連結",
    aliases: ["connections", "關聯", "相關連結", "連結"],
  },
  { canonical: "摘要", aliases: ["summary", "摘要", "總結"] },
  {
    canonical: "待解決的問題",
    aliases: ["open questions", "待解問題", "待解決的問題", "未解問題"],
  },
  { canonical: "衍生內容", aliases: ["derived", "衍生", "衍生內容"] },
  { canonical: "細節", aliases: ["details", "細節", "詳細內容"] },
];

/**
 * Lowercased heading text → canonical zh-TW. Built from {@link HEADING_GROUPS}.
 * Lowercasing is a no-op for the zh-TW aliases and folds English case variants
 * (`Sources`/`SOURCES`) onto one key.
 */
export const HEADING_MAP: Record<string, string> = Object.fromEntries(
  HEADING_GROUPS.flatMap(({ canonical, aliases }) =>
    aliases.map((alias) => [alias.toLowerCase(), canonical])
  )
);

/** Matches an H2 or H3 heading line, capturing the hashes and the text. */
const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/;
/** A fence line: up to 3 leading spaces then 3+ backticks or 3+ tildes. */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

/** The fence marker char (`` ` `` or `~`) if `line` is a fence, else null. */
const fenceMarkerOf = (line: string): string | null => {
  const match = line.match(FENCE_RE);
  return match ? ((match[1] ?? "")[0] ?? null) : null;
};

/**
 * Advance the open-fence state. Opens on any marker when none is open; closes
 * only on the matching marker, so a `~~~` block ignores a stray ``` line.
 */
const toggleFence = (current: string | null, marker: string): string | null => {
  if (current === null) {
    return marker;
  }
  return current === marker ? null : current;
};

/** Canonical rewrite of a heading line, or null if it isn't a mapped heading. */
const rewriteHeadingLine = (line: string): string | null => {
  const match = line.match(HEADING_RE);
  if (!match) {
    return null;
  }
  const canonical = HEADING_MAP[(match[2] ?? "").trim().toLowerCase()];
  return canonical === undefined ? null : `${match[1] ?? ""} ${canonical}`;
};

/**
 * Normalise structural headings in `text`. Pure, idempotent, no I/O.
 *
 * Rules:
 * - Operate line by line. Only H2 (`## `) and H3 (`### `) headings are
 *   candidates. The captured heading text is trimmed and lowercased; if it
 *   matches a key in {@link HEADING_MAP} EXACTLY, the line is replaced with
 *   `"<hashes> <canonical>"` (preserving level, single space after hashes).
 *   Otherwise the line is left byte-identical.
 * - Substring matches do not count: `## Summary of findings` is left alone.
 * - Lines inside a fenced code block (``` or ~~~) are NEVER altered, even if
 *   they look like headings. The opening fence's marker character closes it,
 *   so a `~~~` block is not closed by a stray triple-backtick line.
 * - A trailing `\r` (CRLF input) is preserved on rewritten lines so the file's
 *   line endings stay uniform.
 *
 * @param text raw MDX/markdown content
 * @returns the same content with canonical structural headings
 */
export function normalizeHeadings(text: string): string {
  const lines = text.split("\n");
  let fenceMarker: string | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const hadCR = raw.endsWith("\r");
    const line = hadCR ? raw.slice(0, -1) : raw;

    const marker = fenceMarkerOf(line);
    if (marker !== null) {
      fenceMarker = toggleFence(fenceMarker, marker);
      continue;
    }
    if (fenceMarker !== null) {
      continue; // inside a fenced code block
    }

    const rewritten = rewriteHeadingLine(line);
    if (rewritten !== null) {
      lines[i] = `${rewritten}${hadCR ? "\r" : ""}`;
    }
  }
  return lines.join("\n");
}
