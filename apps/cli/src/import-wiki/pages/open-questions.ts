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
import { titleFromSlug } from "@howardism/article-contract/markup";

import { resolveDomain } from "../domains.ts";
import type { ParsedWikiFile } from "../parse.ts";
import { rewriteWikilinks, stripAuthoringTags } from "../transform.ts";

export type {
  OpenQuestionConcept,
  OpenQuestionsManifest,
} from "@howardism/article-contract/manifests/open-questions";

const BULLET_RE = /^-\s+(.+)$/;
/**
 * The tag usually trails its bullet, but the vault also writes it mid-line when
 * a parenthetical follows ("… #oq/source (Not addressed by …)"), so it is
 * matched anywhere. A backticked mention is the taxonomy being discussed rather
 * than a tag, and is left alone.
 */
const OQ_TAG_RE = /(?<!`)#oq\/([a-z]+)\b/;
const REPEATED_SPACE_RE = /\s{2,}/g;
const OPEN_HEADING_RE = /^##\s+Open Questions\s*$/i;
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
    text: stripAuthoringTags(raw.replace(OQ_TAG_RE, ""))
      .replace(REPEATED_SPACE_RE, " ")
      .trim(),
  };
}

/**
 * Harvest one `## <section>` heading's bullets from every parsed page. Both the
 * open and the settled questions are authored on the concept pages themselves;
 * the vault's generated `open-questions` backlog is a truncated digest of them,
 * so reading the pages keeps the full question text and does not break when the
 * digest's layout is regenerated.
 */
function collectSection(
  parsed: readonly ParsedWikiFile[],
  headingRe: RegExp
): Map<string, string[]> {
  const bySlug = new Map<string, string[]>();

  for (const file of parsed) {
    const bullets: string[] = [];
    let inSection = false;

    for (const rawLine of file.body.split("\n")) {
      const line = rawLine.trim();
      if (headingRe.test(line)) {
        inSection = true;
        continue;
      }
      if (inSection && H2_RE.test(line)) {
        break;
      }
      const bullet = inSection ? BULLET_RE.exec(line) : null;
      if (bullet) {
        bullets.push(bullet[1].trim());
      }
    }

    if (bullets.length > 0) {
      bySlug.set(file.source.slug, bullets);
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

  const resolvedBySlug = collectSection(parsed, RESOLVED_HEADING_RE);
  const open = collectSection(parsed, OPEN_HEADING_RE);

  // Question bullets are prose lifted out of note bodies, so they carry the
  // vault's own `[[wikilink]]`s. Resolve them through the same rewriter the
  // article bodies use: a published slug becomes a markdown link to its
  // article, an unpublished one becomes its plain title. Without this the blog
  // has no way to tell a link from literal brackets, and renders neither.
  const titles = new Map(slugTitleMap);
  const resolveLinks = (text: string): string =>
    rewriteWikilinks(text, titles).body;

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
      questions: questions.map((raw) => {
        const question = toQuestion(raw);
        return { ...question, text: resolveLinks(question.text) };
      }),
      resolved: resolved.map((raw) => resolveLinks(stripAuthoringTags(raw))),
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
