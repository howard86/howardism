import { GLOSSARY_CATEGORIES } from "../glossary/store.ts";

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
    "- All link URLs, including internal `/articles/<slug>` links and any external `https://...` URLs. The set of links must match the source EXACTLY: do not drop a link, and do not invent or add any link that is not already in the source (inventing internal `/articles/<slug>` cross-references is a common and rejected failure).",
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

/**
 * JSON Schema for the structured single-turn final message — handed to
 * `codex exec --output-schema`. `mdx` is the whole translated file; `newTerms`
 * replaces the agent's `glossary add-many` shell call, so the orchestrator can
 * upsert them itself. Both keys are required and no extras are allowed, which
 * is what the OpenAI structured-output decoder needs to constrain generation.
 */
export const TRANSLATION_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    mdx: {
      description:
        "The complete translated MDX file content, starting with the `---` of the frontmatter.",
      type: "string",
    },
    newTerms: {
      description:
        "Proper nouns and technical terms kept verbatim that were NOT already in the do-not-translate glossary.",
      items: {
        additionalProperties: false,
        properties: {
          category: { enum: [...GLOSSARY_CATEGORIES], type: "string" },
          term: { type: "string" },
        },
        required: ["term", "category"],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["mdx", "newTerms"],
  type: "object",
} as const;

export interface BuildStructuredTranslatePromptArgs {
  /** Do-not-translate terms, inlined from the glossary DB (`listTerms`). */
  glossaryTerms: string[];
  /** Full source MDX text, inlined so the engine needs no tool calls. */
  sourceText: string;
  /** ISO/BCP-47 target language tag, e.g. "zh-TW". */
  targetLang: string;
}

/**
 * Single-turn twin of {@link buildTranslatePrompt} for codex structured mode:
 * the source MDX and the glossary are INLINED, and the engine answers with one
 * JSON object matching {@link TRANSLATION_OUTPUT_SCHEMA} instead of reading the
 * source, shelling out to the glossary CLI, and writing the output file. Each
 * of those agent round-trips costs ~11k input tokens of harness overhead, so
 * collapsing three of them into one turn is the entire point.
 *
 * Every byte-identical rule is carried over verbatim in substance from
 * {@link buildTranslatePrompt} — `validate.ts` machine-enforces exactly these,
 * so the two must agree — plus an explicit list-item completeness rule, since
 * dropped bullets are the most common real defect in the existing corpus.
 */
export function buildStructuredTranslatePrompt(
  args: BuildStructuredTranslatePromptArgs
): string {
  const { glossaryTerms, sourceText, targetLang } = args;
  return [
    `You are translating a single blog article from English into ${targetLang} (Traditional Chinese, traditional script).`,
    "",
    "Answer in ONE turn. Do NOT read files, do NOT run shell commands, do NOT write files — the source article and the glossary are inlined below.",
    "",
    `DO-NOT-TRANSLATE (DNT) GLOSSARY — ${glossaryTerms.length} terms, one per line. Keep every one VERBATIM in the output: do not translate, transliterate, or annotate them.`,
    glossaryTerms.length > 0 ? glossaryTerms.join("\n") : "(empty)",
    "",
    "BYTE-IDENTICAL — DO NOT CHANGE",
    '- The `export { default as heroImage } from "../assets/<slug>.png";` line.',
    "- Frontmatter values for the keys: `date`, `tag`, `topic`, `readingTime` (copy them verbatim from the source).",
    "- All link URLs, including internal `/articles/<slug>` links and any external `https://...` URLs. The set of links must match the source EXACTLY: do not drop a link, and do not invent or add any link that is not already in the source (inventing internal `/articles/<slug>` cross-references is a common and rejected failure).",
    "- Every `sources[].title` value (the audit-trail titles in the `sources:` frontmatter list and the `## Sources` body block — keep titles in their original language).",
    "- Fenced code blocks (```...```) and inline code spans (`...`) — keep the contents byte-identical.",
    "- All LaTeX math expressions: everything inside `$...$` (inline math) and `$$...$$` (display math) must be copied byte-identical from the source. Do not translate, reformat, or change any characters inside math spans — including backslash-escaped braces (`\\{`, `\\}`) which are required by the MDX parser.",
    "- HTML entities such as `&lt;`, `&gt;`, `&amp;` in the source must be preserved byte-identical. When writing prose that uses `<` before a digit or `$` sign (e.g. `<50 words`, `<$100`), write `&lt;` — raw `<` before a digit or `$` breaks the MDX parser.",
    "- Every glossary term listed above, wherever it appears.",
    "",
    "TRANSLATE",
    "- Frontmatter `title`, `description`, and `imageAlt`.",
    "- Body prose: headings, paragraphs, lists, blockquotes, table cell text. Translate naturally into idiomatic Traditional Chinese; keep MDX structure (headings, list bullets, blockquote markers, table pipes) intact.",
    "",
    "COMPLETENESS",
    "- EVERY markdown list item (`-`, `*`, or `+` bullet) in the source MUST appear in the translation — same count, same order, same nesting. Long Connections / Open Questions / Sources lists are where bullets get silently dropped; translate every single one.",
    "- Translate the WHOLE article. Never summarise, merge, or omit a section.",
    "",
    "OUTPUT — return ONLY a JSON object matching the schema, nothing else:",
    '{"mdx":"<the complete translated MDX file content>","newTerms":[{"term":"...","category":"person|org|product|tech|entity"}]}',
    "- `mdx` is the ENTIRE file: it must start with `---` on the very first line (no commentary, no prose, no code fences before the frontmatter), then the YAML frontmatter, then a closing `---`, then the body.",
    `- \`newTerms\` lists every NEW person, organization, product, or technical term you kept verbatim that is not already in the glossary above. \`category\` is one of: ${GLOSSARY_CATEGORIES.join(" | ")}. Use an empty array when there are none.`,
    "",
    "SOURCE MDX",
    sourceText,
  ].join("\n");
}
