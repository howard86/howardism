export interface BuildTranslatePromptArgs {
  /**
   * Shell-quoted glossary CLI prefix, e.g.
   * `bun /abs/path/apps/cli/src/glossary/cli.ts`. The engine appends
   * `list`, `add-many '<json>'`, or (fallback) `add "<term>" <category>` to it.
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
 * invariants. New glossary terms are batched into a single `add-many` call
 * at the end of the run rather than per-term `add` calls so concurrent
 * engines don't dogpile the SQLite writer.
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
    "3. While translating, COLLECT every NEW person, organization, product, or technical term you encounter that is NOT in the glossary. Keep each one verbatim in your draft. Do NOT call the glossary CLI yet — buffer them in memory.",
    "4. AFTER the full translation is drafted and BEFORE writing the output file, register every collected new term in a SINGLE batch call:",
    `   ${glossaryCmd} add-many '[{"term":"<term>","category":"<category>"}, ...]'`,
    "   `<category>` is one of: person | org | product | tech | entity. The JSON arg must be a single-quoted array literal so the shell hands it through unchanged. If you have zero new terms, skip this step. As a fallback for a single stray term you noticed last, you may also use:",
    `   ${glossaryCmd} add "<term>" <category>`,
    "   but `add-many` is the primary path — prefer one batched call over many.",
    `5. Write the translated MDX to: ${outputAbsPath}`,
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
    "- All LaTeX math expressions: everything inside `$...$` (inline math) and `$$...$$` (display math) must be copied byte-identical from the source. Do not translate, reformat, or change any characters inside math spans — including backslash-escaped braces (`\\{`, `\\}`) which are required by the MDX parser.",
    "- HTML entities such as `&lt;`, `&gt;`, `&amp;` in the source must be preserved byte-identical. When writing prose that uses `<` before a digit or `$` sign (e.g. `<50 words`, `<$100`), write `&lt;` — raw `<` before a digit or `$` breaks the MDX parser.",
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
