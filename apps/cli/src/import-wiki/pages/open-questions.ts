import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { WikiDomain } from "@howardism/article-contract";
import {
  type OpenQuestionConcept,
  type OpenQuestionsManifest,
  OpenQuestionsManifestSchema,
} from "@howardism/article-contract/manifests/open-questions";

import { OPEN_QUESTIONS_SLUG, resolveDomain } from "../domains.ts";
import type { ParsedWikiFile } from "../parse.ts";
import { extractInternalSlugs, titleFromSlug } from "../wikilink.ts";

export type {
  OpenQuestionConcept,
  OpenQuestionsManifest,
} from "@howardism/article-contract/manifests/open-questions";

const CONCEPT_HEADING_RE = /^##\s+\[\[[^\]]+\]\]/;
const BULLET_RE = /^-\s+(.+)$/;

/**
 * Parse the backlog body into per-concept question lists. The page is a flat
 * sequence of `## [[concept]]` headings, each followed by `- question` bullets.
 */
function parseBacklog(body: string): Map<string, string[]> {
  const byConcept = new Map<string, string[]>();
  let current: string | null = null;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (CONCEPT_HEADING_RE.test(line)) {
      current = extractInternalSlugs(line)[0] ?? null;
      if (current && !byConcept.has(current)) {
        byConcept.set(current, []);
      }
      continue;
    }
    const bullet = BULLET_RE.exec(line);
    if (current && bullet) {
      byConcept.get(current)?.push(bullet[1].trim());
    }
  }
  return byConcept;
}

export function buildOpenQuestions(args: {
  generatedOn: string;
  membership: ReadonlyMap<string, WikiDomain>;
  parsed: readonly ParsedWikiFile[];
  slugTitleMap: ReadonlyMap<string, string>;
}): OpenQuestionsManifest {
  const { parsed, membership, slugTitleMap, generatedOn } = args;

  const backlog = parsed.find(
    (file) => file.source.slug === OPEN_QUESTIONS_SLUG
  );
  if (!backlog) {
    return { generatedOn, byConcept: [] };
  }

  const byConcept: OpenQuestionConcept[] = [];
  for (const [slug, questions] of parseBacklog(backlog.body)) {
    if (questions.length === 0) {
      continue;
    }
    byConcept.push({
      slug,
      title: slugTitleMap.get(slug) ?? titleFromSlug(slug),
      domain: resolveDomain(slug, membership),
      questions,
    });
  }

  byConcept.sort((a, b) => a.title.localeCompare(b.title));
  return { generatedOn, byConcept };
}

export async function emitOpenQuestions(args: {
  dryRun?: boolean;
  manifest: OpenQuestionsManifest;
  outputPath: string;
}): Promise<string> {
  const { manifest, outputPath, dryRun } = args;
  const json = JSON.stringify(OpenQuestionsManifestSchema.parse(manifest));

  if (dryRun) {
    console.log(
      `[open-questions] DRY_RUN — would write ${outputPath} (${manifest.byConcept.length} concepts)`
    );
    return outputPath;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${json}\n`, "utf8");
  return outputPath;
}
