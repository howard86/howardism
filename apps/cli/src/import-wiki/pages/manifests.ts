import type { ParsedWikiFile } from "../parse.ts";
import {
  type ArticleGraph,
  buildArticleGraph,
  emitArticleGraph,
} from "./graph.ts";
import {
  buildWikiSources,
  emitWikiSources,
  type WikiSourcesManifest,
} from "./wiki-sources.ts";

export interface ManifestSet {
  graph: ArticleGraph;
  sources: WikiSourcesManifest;
}

export interface BuildManifestsArgs {
  /** YYYY-MM-DD, injected once by the caller. */
  generatedOn: string;
  parsed: ParsedWikiFile[];
  rawRoot: string;
}

export async function buildManifests(
  args: BuildManifestsArgs
): Promise<ManifestSet> {
  const { parsed, rawRoot, generatedOn } = args;

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

  return { graph, sources };
}

export interface WriteManifestsArgs {
  dryRun: boolean;
  graphOutputPath: string;
  set: ManifestSet;
  sourcesOutputPath: string;
}

export async function writeManifests(
  args: WriteManifestsArgs
): Promise<{ graphPath: string }> {
  const { set, graphOutputPath, sourcesOutputPath, dryRun } = args;

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

  return { graphPath };
}
