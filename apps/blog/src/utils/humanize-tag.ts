const WORD_SPLIT = /[\s-]+/;

/** Domain acronyms that should render upper-case rather than title-cased. */
const ACRONYMS = new Set([
  "ai",
  "api",
  "cli",
  "cot",
  "gpu",
  "hr",
  "llm",
  "mcp",
  "rag",
  "rlhf",
  "sft",
  "ui",
  "ux",
]);

/**
 * Render a stored subject tag (lowercase kebab, e.g. `human-ai-collaboration`)
 * as a display label (`Human AI Collaboration`), upper-casing known acronyms.
 */
export function humanizeTag(tag: string): string {
  return tag
    .split(WORD_SPLIT)
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}
