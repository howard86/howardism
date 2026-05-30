import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

import { ArticleContractSchema } from "@howardism/article-contract/schema";
import matter from "gray-matter";

const HERO_IMAGE_LINE_RE = /^export \{ default as heroImage \} from "[^"]+";$/m;
const MDX_SUFFIX_RE = /\.mdx$/;

export interface ValidateTranslationArgs {
  outputAbsPath: string;
  sourceAbsPath: string;
}

export interface ValidationResult {
  errors: string[];
  ok: boolean;
}

const dateToIsoDay = (value: unknown): unknown => {
  if (value instanceof Date) {
    // Use the YYYY-MM-DD prefix; matches the unquoted YAML date format used
    // throughout the corpus.
    return value.toISOString().slice(0, 10);
  }
  return value;
};

interface NormalisedFrontmatter {
  data: Record<string, unknown>;
  imageAlt: unknown;
}

const normaliseFrontmatter = (
  data: Record<string, unknown>
): NormalisedFrontmatter => {
  const out: Record<string, unknown> = { ...data };
  if ("date" in out) {
    out.date = dateToIsoDay(out.date);
  }
  // imageAlt is blog-only — not part of the write-time contract — so we lift
  // it out before schema validation.
  const { imageAlt, ...rest } = out;
  return { data: rest, imageAlt };
};

const extractHeroImageLine = (text: string): string | null => {
  const match = text.match(HERO_IMAGE_LINE_RE);
  return match ? match[0] : null;
};

const slugFromPath = (path: string): string =>
  basename(path).replace(MDX_SUFFIX_RE, "");

interface PreservedKeys {
  date: unknown;
  domain: unknown;
  readingTime: unknown;
  tag: unknown;
}

const pickPreserved = (data: Record<string, unknown>): PreservedKeys => ({
  date: dateToIsoDay(data.date),
  readingTime: data.readingTime,
  tag: data.tag,
  domain: data.domain,
});

const equalScalar = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  // Both undefined or both null
  if (a == null && b == null) {
    return true;
  }
  return false;
};

/**
 * Post-write validation for translated MDX. Mirrors `assertValidPng` from
 * `import-wiki/codex.ts` but for text: collects every failure into `errors`
 * so the orchestrator can decide whether to retry without re-running the
 * engine for each individual check.
 */
export async function validateTranslation(
  args: ValidateTranslationArgs
): Promise<ValidationResult> {
  const { sourceAbsPath, outputAbsPath } = args;
  const errors: string[] = [];

  // 1. Output exists and is non-empty.
  let outputStat: Awaited<ReturnType<typeof stat>>;
  try {
    outputStat = await stat(outputAbsPath);
  } catch {
    return {
      ok: false,
      errors: [`Output file does not exist: ${outputAbsPath}`],
    };
  }
  if (outputStat.size === 0) {
    return { ok: false, errors: [`Output file is empty: ${outputAbsPath}`] };
  }

  const outputText = await readFile(outputAbsPath, "utf8");

  // 2. Starts with "---".
  if (!outputText.startsWith("---")) {
    errors.push(
      `Output does not start with "---" (frontmatter must be the very first bytes)`
    );
  }

  // 3. Frontmatter parses + passes the article contract schema.
  let outputData: Record<string, unknown> = {};
  let outputImageAlt: unknown;
  try {
    const parsed = matter(outputText);
    const normalised = normaliseFrontmatter(
      parsed.data as Record<string, unknown>
    );
    outputData = normalised.data;
    outputImageAlt = normalised.imageAlt;
    const schemaResult = ArticleContractSchema.safeParse(outputData);
    if (!schemaResult.success) {
      errors.push(
        `Output frontmatter fails ArticleContractSchema: ${schemaResult.error.message}`
      );
    }
  } catch (err) {
    errors.push(
      `Failed to parse output frontmatter: ${(err as Error).message}`
    );
  }

  // 4. imageAlt is a non-empty string.
  if (typeof outputImageAlt !== "string" || outputImageAlt.trim() === "") {
    errors.push("Output frontmatter `imageAlt` must be a non-empty string");
  }

  // 5. heroImage line equals source's byte-for-byte.
  let sourceText: string;
  try {
    sourceText = await readFile(sourceAbsPath, "utf8");
  } catch (err) {
    errors.push(`Failed to read source: ${(err as Error).message}`);
    return { ok: errors.length === 0, errors };
  }
  const sourceHero = extractHeroImageLine(sourceText);
  const outputHero = extractHeroImageLine(outputText);
  if (!sourceHero) {
    errors.push("Source is missing a heroImage export line");
  }
  if (!outputHero) {
    errors.push("Output is missing a heroImage export line");
  }
  if (sourceHero && outputHero && sourceHero !== outputHero) {
    errors.push(
      `heroImage line mismatch:\n  source: ${sourceHero}\n  output: ${outputHero}`
    );
  }

  // 6. Preserved frontmatter keys (date, tag, topic, readingTime) match.
  // Guard the source parse: a malformed source must surface as a validation
  // error, not an uncaught throw that aborts the whole run.
  let sourceData: Record<string, unknown> | null = null;
  try {
    sourceData = matter(sourceText).data as Record<string, unknown>;
  } catch (err) {
    errors.push(
      `Failed to parse source frontmatter: ${(err as Error).message}`
    );
  }
  if (sourceData) {
    const sourcePreserved = pickPreserved(sourceData);
    const outputPreserved = pickPreserved(outputData);
    for (const key of ["date", "tag", "domain", "readingTime"] as const) {
      if (!equalScalar(sourcePreserved[key], outputPreserved[key])) {
        errors.push(
          `Frontmatter \`${key}\` changed: source=${JSON.stringify(
            sourcePreserved[key]
          )}, output=${JSON.stringify(outputPreserved[key])}`
        );
      }
    }
  }

  // 7. Slug matches.
  const sourceSlug = slugFromPath(sourceAbsPath);
  const outputSlug = slugFromPath(outputAbsPath);
  if (sourceSlug !== outputSlug) {
    errors.push(
      `Output filename slug "${outputSlug}" does not match source slug "${sourceSlug}"`
    );
  }

  return { ok: errors.length === 0, errors };
}
