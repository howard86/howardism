/** biome-ignore-all lint/performance/noAwaitInLoops: Filesystem operations are deliberately serialized to bound memory and preserve snapshot/replacement order. */
const STRUCTURE_PATTERNS = [/```/, /\|[^\n]+\|/];

import { cp, lstat, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { WIKI_DOMAINS } from "@howardism/article-contract";
import {
  ArticlesMetaManifestSchema,
  LocalizedArticlesMetaManifestSchema,
} from "@howardism/article-contract/manifests/articles-meta";
import { parseArticleGraph } from "@howardism/article-contract/manifests/graph";
import { OpenQuestionsManifestSchema } from "@howardism/article-contract/manifests/open-questions";
import { SearchIndexSchema } from "@howardism/article-contract/manifests/search-index";
import { TranslationsManifestSchema } from "@howardism/article-contract/manifests/translations";
import { WikiSourcesManifestSchema } from "@howardism/article-contract/manifests/wiki-sources";
import { extractHeroImage } from "../content-check";
import { contentPaths } from "./paths";
import { validateSnapshot } from "./validate";

/** Deterministic curated coverage: domains, entity kinds, structure and both locales. */
export async function generateFixtures(
  root: string,
  destination: string
): Promise<void> {
  const source = contentPaths(root);
  const output = contentPaths(destination);
  if (
    source.root === output.root ||
    source.root.startsWith(`${output.root}/`) ||
    output.root.startsWith(`${source.root}/`)
  ) {
    throw new Error("Fixture source and destination must differ");
  }
  try {
    await lstat(output.root);
    if (!(await Bun.file(resolve(output.root, "coverage.json")).exists())) {
      throw new Error("Refusing to overwrite an undeclared fixture directory");
    }
  } catch (error) {
    if (
      !(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      )
    ) {
      throw error;
    }
  }
  // Generation is an explicit authoring operation; preparation only reads the committed result.
  const read = async (name: string): Promise<unknown> =>
    await Bun.file(source.manifest(name)).json();
  const meta = ArticlesMetaManifestSchema.parse(
    await read("articles-meta.json")
  );
  const localized = LocalizedArticlesMetaManifestSchema.parse(
    await read("articles-meta.zh-TW.json")
  );
  const translated = new Set(localized.articles.map((a) => a.slug));
  const selected = await selectFixtureSlugs(
    meta.articles,
    translated,
    source.articles
  );
  // Refuse overwriting anything except a previously generated fixture tree.
  if (await Bun.file(resolve(output.root, "coverage.json")).exists()) {
    await rm(output.root, { recursive: true, force: true });
  }
  await mkdir(output.articles, { recursive: true });
  await mkdir(output.translated, { recursive: true });
  await mkdir(output.assets, { recursive: true });
  const assets = new Set<string>();
  for (const slug of selected) {
    for (const [from, to] of [
      [source.articles, output.articles],
      [source.translated, output.translated],
    ]) {
      const file = `${slug}.mdx`;
      const raw = await Bun.file(resolve(from, file)).text();
      const hero = extractHeroImage(raw);
      if (hero) {
        assets.add(hero);
      }
      await cp(resolve(from, file), resolve(to, file));
    }
  }
  for (const asset of assets) {
    await cp(resolve(source.assets, asset), resolve(output.assets, asset));
  }
  const write = async (name: string, value: unknown): Promise<void> => {
    await Bun.write(
      output.manifest(name),
      `${JSON.stringify(value, null, 2)}\n`
    );
  };
  await write("articles-meta.json", {
    ...meta,
    articles: meta.articles.filter((a) => selected.has(a.slug)),
  });
  await write("articles-meta.zh-TW.json", {
    ...localized,
    articles: localized.articles.filter((a) => selected.has(a.slug)),
  });
  const graph = parseArticleGraph(await read("article-graph.json"));
  await write("article-graph.json", {
    ...graph,
    backlinks: Object.fromEntries(
      Object.entries(graph.backlinks)
        .filter(([slug]) => selected.has(slug))
        .map(([slug, edges]) => [
          slug,
          edges.filter((edge) => selected.has(edge.slug)),
        ])
    ),
    related: Object.fromEntries(
      Object.entries(graph.related)
        .filter(([slug]) => selected.has(slug))
        .map(([slug, slugs]) => [slug, slugs.filter((s) => selected.has(s))])
    ),
  });
  const search = SearchIndexSchema.parse(await read("search-index.json"));
  await write("search-index.json", {
    ...search,
    entries: search.entries.filter((a) => selected.has(a.slug)),
  });
  const questions = OpenQuestionsManifestSchema.parse(
    await read("open-questions.json")
  );
  await write("open-questions.json", {
    ...questions,
    byConcept: questions.byConcept.filter((a) => selected.has(a.slug)),
  });
  const sources = WikiSourcesManifestSchema.parse(
    await read("wiki-sources.json")
  );
  await write("wiki-sources.json", {
    ...sources,
    sources: sources.sources
      .map((s) => ({
        ...s,
        citedBy: s.citedBy.filter((slug) => selected.has(slug)),
      }))
      .filter((s) => s.citedBy.length),
  });
  const translations = TranslationsManifestSchema.parse(
    await read("translations.json")
  );
  await write("translations.json", {
    ...translations,
    articles: Object.fromEntries(
      Object.entries(translations.articles).filter(([slug]) =>
        selected.has(slug)
      )
    ),
  });
  await Bun.write(
    resolve(output.root, "coverage.json"),
    `${JSON.stringify({ schemaVersion: 1, slugs: [...selected].sort(), domains: [...new Set(meta.articles.filter((a) => selected.has(a.slug)).map((a) => a.meta.domain))].sort(), locales: ["en", "zh-TW"], articleBodyLinks: "production" }, null, 2)}\n`
  );
  await validateSnapshot(output.root, "sample");
}

async function selectFixtureSlugs(
  articles: ReturnType<typeof ArticlesMetaManifestSchema.parse>["articles"],
  translated: Set<string>,
  articlesDir: string
): Promise<Set<string>> {
  const selected = new Set<string>();
  const candidates = [...articles].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const domain of WIKI_DOMAINS) {
    const article = candidates.find(
      (a) =>
        a.meta.domain === domain &&
        translated.has(a.slug) &&
        !a.slug.startsWith("moc-")
    );
    if (article) {
      selected.add(article.slug);
    }
  }
  for (const kind of new Set(
    candidates.map((a) => a.meta.entityType).filter(Boolean)
  )) {
    const article = candidates.find(
      (a) => a.meta.entityType === kind && translated.has(a.slug)
    );
    if (article && selected.size < 15) {
      selected.add(article.slug);
    }
  }
  // Exercise MDX table and fenced-code rendering where available.
  for (const pattern of STRUCTURE_PATTERNS) {
    for (const article of candidates.filter((a) => translated.has(a.slug))) {
      if (
        pattern.test(
          await Bun.file(resolve(articlesDir, `${article.slug}.mdx`)).text()
        )
      ) {
        selected.add(article.slug);
        break;
      }
    }
  }
  for (const article of candidates) {
    if (selected.size >= 15) {
      break;
    }
    if (translated.has(article.slug)) {
      selected.add(article.slug);
    }
  }
  return selected;
}
