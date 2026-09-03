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

/** Where one section's scan stands: not reached, open, or closed for good. */
type SectionState = "before" | "in" | "done";

/**
 * Advance one section's scan by a line. The section opens on its own heading
 * and closes for good at the next `##` — a separate scan per section simply
 * stopped reading there, so a heading that recurs after the close is ignored.
 * `isH2` is hoisted out because both scans share it, and because only an `##`
 * line can be a section heading.
 */
function stepSection(
  state: SectionState,
  line: string,
  isH2: boolean,
  headingRe: RegExp,
  bullets: string[]
): SectionState {
  if (state === "done") {
    return state;
  }
  if (isH2) {
    if (headingRe.test(line)) {
      return "in";
    }
    return state === "in" ? "done" : state;
  }
  if (state !== "in") {
    return state;
  }
  const bullet = BULLET_RE.exec(line);
  if (bullet) {
    bullets.push(bullet[1].trim());
  }
  return state;
}

/**
 * Harvest the `## Open Questions` and `## Resolved Questions` bullets from
 * every parsed page, in one walk of each body. Both are authored on the
 * concept pages themselves; the vault's generated `open-questions` backlog is
 * a truncated digest of them, so reading the pages keeps the full question
 * text and does not break when the digest's layout is regenerated.
 */
export function collectQuestionSections(parsed: readonly ParsedWikiFile[]): {
  open: Map<string, string[]>;
  resolved: Map<string, string[]>;
} {
  const open = new Map<string, string[]>();
  const resolved = new Map<string, string[]>();

  for (const file of parsed) {
    const openBullets: string[] = [];
    const resolvedBullets: string[] = [];
    let openState: SectionState = "before";
    let resolvedState: SectionState = "before";

    for (const rawLine of file.body.split("\n")) {
      const line = rawLine.trim();
      const isH2 = H2_RE.test(line);
      openState = stepSection(
        openState,
        line,
        isH2,
        OPEN_HEADING_RE,
        openBullets
      );
      resolvedState = stepSection(
        resolvedState,
        line,
        isH2,
        RESOLVED_HEADING_RE,
        resolvedBullets
      );
      if (openState === "done" && resolvedState === "done") {
        break;
      }
    }

    if (openBullets.length > 0) {
      open.set(file.source.slug, openBullets);
    }
    if (resolvedBullets.length > 0) {
      resolved.set(file.source.slug, resolvedBullets);
    }
  }
  return { open, resolved };
}

export function buildOpenQuestions(args: {
  generatedOn: string;
  membership: ReadonlyMap<string, WikiDomain>;
  parsed: readonly ParsedWikiFile[];
  slugTitleMap: ReadonlyMap<string, string>;
}): OpenQuestionsManifest {
  const { parsed, membership, slugTitleMap, generatedOn } = args;

  const { open, resolved: resolvedBySlug } = collectQuestionSections(parsed);

  // Question bullets are prose lifted out of note bodies, so they carry the
  // vault's own `[[wikilink]]`s. Resolve them through the same rewriter the
  // article bodies use: a published slug becomes a markdown link to its
  // article, an unpublished one becomes its plain title. Without this the blog
  // has no way to tell a link from literal brackets, and renders neither.
  const resolveLinks = (text: string): string =>
    rewriteWikilinks(text, slugTitleMap).body;

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
