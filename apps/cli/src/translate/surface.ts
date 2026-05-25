import matter from "gray-matter";

/**
 * Frontmatter keys copied byte-identical into the translation (NOT translated).
 * Kept in lockstep with `pickPreserved` in `validate.ts` — these are the keys
 * a VERBATIM-DRIFT re-sync touches without calling an engine.
 */
export const VERBATIM_KEYS = ["date", "tag", "topic", "readingTime"] as const;
export type VerbatimKey = (typeof VERBATIM_KEYS)[number];

const FRONTMATTER_RE = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;

const frontmatterBlock = (text: string): string => {
  const m = text.match(FRONTMATTER_RE);
  return m ? m[2] : "";
};

const TRAILING_CR_RE = /\r$/;

const verbatimRawLine = (block: string, key: VerbatimKey): string | null => {
  // ^key: ... $ — `^tag:` cannot match `tags:` (the char after "tag" is "s",
  // not ":"), so the keys never collide.
  const m = block.match(new RegExp(`^${key}:.*$`, "m"));
  return m ? m[0].replace(TRAILING_CR_RE, "") : null;
};

/**
 * True when any copy-verbatim frontmatter field differs between source and
 * output — i.e. the translatable surface is unchanged but a preserved scalar
 * (date/tag/topic/readingTime) drifted. Compared as raw lines, since the
 * contract requires these byte-identical anyway.
 */
export function verbatimDiffers(
  sourceText: string,
  outputText: string
): boolean {
  const src = frontmatterBlock(sourceText);
  const out = frontmatterBlock(outputText);
  for (const key of VERBATIM_KEYS) {
    if (verbatimRawLine(src, key) !== verbatimRawLine(out, key)) {
      return true;
    }
  }
  return false;
}

/**
 * Re-copy the source's verbatim frontmatter lines into the output, leaving the
 * translated title/description/imageAlt and the body untouched. Cheap, no
 * engine call. Only the frontmatter region is rewritten; an absent key is left
 * as-is (the contract guarantees these keys exist).
 */
export function resyncVerbatimFields(
  outputText: string,
  sourceText: string
): string {
  const fm = outputText.match(FRONTMATTER_RE);
  if (!fm) {
    return outputText;
  }
  const srcBlock = frontmatterBlock(sourceText);
  let block = fm[2];
  for (const key of VERBATIM_KEYS) {
    const srcLine = verbatimRawLine(srcBlock, key);
    if (srcLine == null) {
      continue;
    }
    const re = new RegExp(`^${key}:.*$`, "m");
    if (re.test(block)) {
      block = block.replace(re, srcLine);
    }
  }
  const before = outputText.slice(0, fm.index ?? 0);
  const after = outputText.slice((fm.index ?? 0) + fm[0].length);
  return `${before}${fm[1]}${block}${fm[3]}${after}`;
}

/** Source `title` frontmatter value (English), for the audit trail. */
export function sourceTitle(rawMdx: string): string | null {
  const { data } = matter(rawMdx);
  const title = (data as Record<string, unknown>).title;
  return typeof title === "string" ? title : null;
}
