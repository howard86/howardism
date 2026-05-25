export interface BuildTranslatePromptArgs {
  /**
   * Shell-quoted glossary CLI prefix, e.g.
   * `bun /abs/path/apps/cli/src/translate/glossary.ts`. The engine appends
   * `list` or `add "<term>" <category>` to it.
   */
  glossaryCmd: string;
  outputAbsPath: string;
  sourceAbsPath: string;
  /** ISO/BCP-47 target language tag, e.g. "zh-TW". */
  targetLang: string;
}

/**
 * Build the engine-facing translation brief. Tightly scoped: the engine reads
 * one source MDX, writes one output MDX, never touches anything else, and
 * uses the glossary CLI to keep proper nouns / technical terms verbatim
 * across the corpus.
 *
 * The prompt is deliberately explicit about byte-identical preservation
 * (heroImage line, frontmatter keys `date`/`tag`/`topic`/`readingTime`, link
 * URLs, `sources[].title`) so the post-write validator can trust those
 * invariants.
 */
export function buildTranslatePrompt(args: BuildTranslatePromptArgs): string {
  const { sourceAbsPath, outputAbsPath, targetLang, glossaryCmd } = args;
  return [
    `You are translating a single blog article from English into ${targetLang} (Traditional Chinese, traditional script).`,
    "",
    "STRICT WORKFLOW",
    `1. Read the source MDX from: ${sourceAbsPath}`,
    "2. Run the glossary list command first to fetch the do-not-translate (DNT) terms:",
    `   ${glossaryCmd} list`,
    "   Treat every listed `term` as VERBATIM in the output — do not translate, transliterate, or annotate them.",
    "3. While translating, whenever a NEW person, organization, product, or technical term appears that is NOT in the glossary, register it before continuing:",
    `   ${glossaryCmd} add "<term>" <category>`,
    "   where `<category>` is one of: person | org | product | tech | entity. Then keep the term verbatim in the output too.",
    `4. Write the translated MDX to: ${outputAbsPath}`,
    "   Create the parent directory if it does not exist. Do NOT modify, create, or delete any other file. Only write that single output path.",
    "",
    "OUTPUT FORMAT — the written file MUST",
    "- Start with `---` on the very first line (no commentary, no prose, no code fences before frontmatter).",
    "- Contain a YAML frontmatter block, then a closing `---`, then the body.",
    `- Include the line \`export { default as heroImage } from "../assets/<slug>.png";\` BYTE-IDENTICAL to the source's heroImage line.`,
    "",
    "BYTE-IDENTICAL — DO NOT CHANGE",
    '- The `export { default as heroImage } from "../assets/<slug>.png";` line.',
    "- Frontmatter values for the keys: `date`, `tag`, `topic`, `readingTime` (copy them verbatim from the source).",
    "- All link URLs, including internal `/articles/<slug>` links and any external `https://...` URLs.",
    "- Every `sources[].title` value (the audit-trail titles in the `sources:` frontmatter list and the `## Sources` body block — keep titles in their original language).",
    "- Fenced code blocks (```...```) and inline code spans (`...`) — keep the contents byte-identical.",
    "- Every glossary term (from the `list` command) wherever it appears.",
    "",
    "TRANSLATE",
    "- Frontmatter `title`, `description`, and `imageAlt`.",
    "- Body prose: headings, paragraphs, lists, blockquotes, table cell text. Translate naturally into idiomatic Traditional Chinese; keep MDX structure (headings, list bullets, blockquote markers, table pipes) intact.",
    "",
    "GUARDRAILS",
    "- Output ONLY the translated MDX file at the destination path. Do not print the file contents to stdout. Do not write logs or extra files.",
    "- The first byte of the output file must be the `-` of the opening `---`. No leading whitespace, no Markdown fences, no commentary.",
    `- Re-run \`${glossaryCmd} list\` if you are unsure whether a term is in the glossary; rely on the glossary, not on memory.`,
  ].join("\n");
}
