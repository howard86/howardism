import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { WikiDomain } from "@howardism/article-contract";
import {
  OPEN_QUESTION_KINDS,
  type OpenQuestion,
  type OpenQuestionConcept,
  type OpenQuestionsManifest,
  OpenQuestionsManifestSchema,
} from "@howardism/article-contract/manifests/open-questions";

import { OPEN_QUESTIONS_SLUG, resolveDomain } from "../domains.ts";
import type { ParsedWikiFile } from "../parse.ts";
import { stripAuthoringTags } from "../transform.ts";
import { extractInternalSlugs, titleFromSlug } from "../wikilink.ts";

export type {
  OpenQuestionConcept,
  OpenQuestionsManifest,
} from "@howardism/article-contract/manifests/open-questions";

const HEADING_RE = /^#{1,6}\s/;
const CONCEPT_HEADING_RE = /^#{2,6}\s+\[\[[^\]]+\]\]/;
const BULLET_RE = /^-\s+(.+)$/;
/**
 * The tag usually trails its bullet, but the vault also writes it mid-line when
 * a parenthetical follows ("… #oq/source (Not addressed by …)"), so it is
 * matched anywhere. A backticked mention is the taxonomy being discussed rather
 * than a tag, and is left alone.
 */
const OQ_TAG_RE = /(?<!`)#oq\/([a-z]+)\b/;
const REPEATED_SPACE_RE = /\s{2,}/g;
const RESOLVED_HEADING_RE = /^##\s+Resolved Questions\s*$/i;
const H2_RE = /^##\s/;

const KINDS: ReadonlySet<string> = new Set(OPEN_QUESTION_KINDS);

/**
 * Split a backlog bullet into its published text and its `#oq/*` triage tag.
 * The tag is the signal that separates an answerable question from a standing
 * request for evidence, so it is captured here before `stripAuthoringTags`
 * removes it from the prose. An unrecognised or absent tag yields `null`
 * rather than a guessed bucket.
 */
function toQuestion(raw: string): OpenQuestion {
  const tag = OQ_TAG_RE.exec(raw)?.[1];
  return {
    kind: tag && KINDS.has(tag) ? (tag as OpenQuestion["kind"]) : null,
    text: raw.replace(OQ_TAG_RE, "").replace(REPEATED_SPACE_RE, " ").trim(),
  };
}

/**
 * Parse the backlog body into per-concept question lists. Concepts are
 * `[[concept]]` headings — the vault nests them under domain sections
 * (`## Actionable by domain` → `### <domain>` → `#### [[concept]]`), so any
 * heading level is accepted. Each is followed by `- question` bullets.
 *
 * Any other heading closes the current concept, which keeps the trailing
 * `## Predictions` / `## Notes` / `## In progress` sections — flat
 * `- [[slug]]: …` bullets with no concept heading of their own — from being
 * appended to whichever concept happened to come last.
 */
function parseBacklog(body: string): Map<string, OpenQuestion[]> {
  const byConcept = new Map<string, OpenQuestion[]>();
  let current: string | null = null;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (HEADING_RE.test(line)) {
      current = CONCEPT_HEADING_RE.test(line)
        ? (extractInternalSlugs(line)[0] ?? null)
        : null;
      if (current && !byConcept.has(current)) {
        byConcept.set(current, []);
      }
      continue;
    }
    const bullet = BULLET_RE.exec(line);
    if (current && bullet) {
      byConcept.get(current)?.push(toQuestion(bullet[1].trim()));
    }
  }
  return byConcept;
}

/**
 * Harvest each concept page's `## Resolved Questions` bullets — the questions
 * the vault has actually settled. They live on the concept pages, not in the
 * generated backlog, so they are read straight from the parsed vault files.
 */
function parseResolved(
  parsed: readonly ParsedWikiFile[]
): Map<string, string[]> {
  const bySlug = new Map<string, string[]>();

  for (const file of parsed) {
    const resolved: string[] = [];
    let inSection = false;

    for (const rawLine of file.body.split("\n")) {
      const line = rawLine.trim();
      if (RESOLVED_HEADING_RE.test(line)) {
        inSection = true;
        continue;
      }
      if (inSection && H2_RE.test(line)) {
        break;
      }
      const bullet = inSection ? BULLET_RE.exec(line) : null;
      if (bullet) {
        resolved.push(stripAuthoringTags(bullet[1].trim()));
      }
    }

    if (resolved.length > 0) {
      bySlug.set(file.source.slug, resolved);
    }
  }
  return bySlug;
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

  const resolvedBySlug = parseResolved(parsed);
  const open = parseBacklog(backlog.body);

  // A concept earns an entry if it has open questions *or* settled ones — a
  // page whose questions have all been answered is the most useful thing the
  // manifest can carry, so it must not be dropped for having an empty backlog.
  const slugs = new Set([...open.keys(), ...resolvedBySlug.keys()]);

  const byConcept: OpenQuestionConcept[] = [];
  for (const slug of slugs) {
    const questions = open.get(slug) ?? [];
    const resolved = resolvedBySlug.get(slug) ?? [];
    if (questions.length === 0 && resolved.length === 0) {
      continue;
    }
    byConcept.push({
      slug,
      title: slugTitleMap.get(slug) ?? titleFromSlug(slug),
      domain: resolveDomain(slug, membership),
      questions,
      resolved,
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
  const json = JSON.stringify(
    OpenQuestionsManifestSchema.parse(manifest),
    null,
    2
  );

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
