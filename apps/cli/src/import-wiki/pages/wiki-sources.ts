import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  type WikiSource,
  type WikiSourcesManifest,
  WikiSourcesManifestSchema,
} from "@howardism/article-contract/manifests/wiki-sources";

import {
  extractRawSlugsFromSources,
  loadRawDoc,
  type ParsedWikiFile,
} from "../parse.ts";

export type {
  WikiSource,
  WikiSourcesManifest,
} from "@howardism/article-contract/manifests/wiki-sources";

const PUNCT_RE = /[._-]+/g;
const WS_RE = /\s+/g;
const TALK_URL_RE = /youtube\.com|youtu\.be/i;
const PAPER_URL_RE = /arxiv\.org/i;
const REPO_URL_RE = /github\.com/i;

function deriveKind(url: string | undefined): string {
  if (!url) {
    return "Note";
  }
  if (TALK_URL_RE.test(url)) {
    return "Talk";
  }
  if (PAPER_URL_RE.test(url)) {
    return "Paper";
  }
  if (REPO_URL_RE.test(url)) {
    return "Repo";
  }
  return "Article";
}

/** Readable title fallback for raw docs missing from disk. */
function humanize(slug: string): string {
  const last = slug.split("/").pop() ?? slug;
  return last.replace(PUNCT_RE, " ").replace(WS_RE, " ").trim();
}

/**
 * Build the reading-list manifest: every raw source cited by a live note,
 * with citation lists and reading metadata. Sorted by citation count, then
 * recency, then title — deterministic for snapshot stability.
 */
export async function buildWikiSources(args: {
  generatedOn: string;
  parsed: ParsedWikiFile[];
  rawRoot: string;
}): Promise<WikiSourcesManifest> {
  const { parsed, rawRoot, generatedOn } = args;

  const citedBy = new Map<string, string[]>();
  for (const file of parsed) {
    for (const rawSlug of extractRawSlugsFromSources(
      file.frontmatter.sources
    )) {
      const list = citedBy.get(rawSlug) ?? [];
      if (!list.includes(file.source.slug)) {
        list.push(file.source.slug);
      }
      citedBy.set(rawSlug, list);
    }
  }

  const sources: WikiSource[] = await Promise.all(
    [...citedBy].map(async ([rawSlug, citers]) => {
      const doc = await loadRawDoc(rawRoot, rawSlug);
      const url = doc?.url;
      return {
        title: doc?.title ?? humanize(rawSlug),
        url,
        author: doc?.author,
        published: doc?.published,
        kind: deriveKind(url),
        citedBy: [...citers].sort(),
      };
    })
  );

  sources.sort((a, b) => {
    if (a.citedBy.length !== b.citedBy.length) {
      return b.citedBy.length - a.citedBy.length;
    }
    const ap = a.published ?? "";
    const bp = b.published ?? "";
    if (ap !== bp) {
      return bp.localeCompare(ap);
    }
    return a.title.localeCompare(b.title);
  });

  return { generatedOn, sources };
}

export async function emitWikiSources(args: {
  dryRun?: boolean;
  manifest: WikiSourcesManifest;
  outputPath: string;
}): Promise<string> {
  const { manifest, outputPath, dryRun } = args;
  const json = JSON.stringify(
    WikiSourcesManifestSchema.parse(manifest),
    null,
    2
  );

  if (dryRun) {
    console.log(
      `[wiki-sources] DRY_RUN — would write ${outputPath} (${manifest.sources.length} sources)`
    );
    return outputPath;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${json}\n`, "utf8");
  return outputPath;
}
