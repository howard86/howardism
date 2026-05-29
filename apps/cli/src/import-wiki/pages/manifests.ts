import type { WikiDomain } from "@howardism/article-contract";

import type { ParsedWikiFile } from "../parse.ts";
import {
  type ArticleGraph,
  buildArticleGraph,
  emitArticleGraph,
} from "./graph.ts";
import {
  buildOpenQuestions,
  emitOpenQuestions,
  type OpenQuestionsManifest,
} from "./open-questions.ts";
import {
  buildWikiSources,
  emitWikiSources,
  type WikiSourcesManifest,
} from "./wiki-sources.ts";

export interface ManifestSet {
  graph: ArticleGraph;
  openQuestions: OpenQuestionsManifest;
  sources: WikiSourcesManifest;
}

export interface BuildManifestsArgs {
  /** YYYY-MM-DD, injected once by the caller. */
  generatedOn: string;
  membership: ReadonlyMap<string, WikiDomain>;
  parsed: ParsedWikiFile[];
  rawRoot: string;
  slugTitleMap: ReadonlyMap<string, string>;
}

export async function buildManifests(
  args: BuildManifestsArgs
): Promise<ManifestSet> {
  const { parsed, rawRoot, generatedOn, membership, slugTitleMap } = args;

  const graph = buildArticleGraph({
    parsed,
    generatedOn,
    isArchived: (p) => p.frontmatter.archived === true,
  });

  const live = parsed.filter((p) => p.frontmatter.archived !== true);
  const sources = await buildWikiSources({
    parsed: live,
    rawRoot,
    generatedOn,
  });

  const openQuestions = buildOpenQuestions({
    parsed: live,
    membership,
    slugTitleMap,
    generatedOn,
  });

  return { graph, sources, openQuestions };
}

export interface WriteManifestsArgs {
  dryRun: boolean;
  graphOutputPath: string;
  openQuestionsOutputPath: string;
  set: ManifestSet;
  sourcesOutputPath: string;
}

export async function writeManifests(
  args: WriteManifestsArgs
): Promise<{ graphPath: string }> {
  const {
    set,
    graphOutputPath,
    sourcesOutputPath,
    openQuestionsOutputPath,
    dryRun,
  } = args;

  const graphPath = await emitArticleGraph({
    graph: set.graph,
    outputPath: graphOutputPath,
    dryRun,
  });

  await emitWikiSources({
    manifest: set.sources,
    outputPath: sourcesOutputPath,
    dryRun,
  });

  await emitOpenQuestions({
    manifest: set.openQuestions,
    outputPath: openQuestionsOutputPath,
    dryRun,
  });

  return { graphPath };
}
