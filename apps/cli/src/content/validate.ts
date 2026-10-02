const MDX_SUFFIX = /\.mdx$/;

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { LocalizedArticlesMetaManifestSchema } from "@howardism/article-contract/manifests/articles-meta";
import { OpenQuestionsManifestSchema } from "@howardism/article-contract/manifests/open-questions";
import { SearchIndexSchema } from "@howardism/article-contract/manifests/search-index";
import { TranslationsManifestSchema } from "@howardism/article-contract/manifests/translations";
import { WikiSourcesManifestSchema } from "@howardism/article-contract/manifests/wiki-sources";
import { z } from "zod";
import { buildLocalizedArticlesMeta } from "../articles-meta";
import {
  checkFrontmatter,
  checkHeroImages,
  parseArticle,
  validateContent,
} from "../content-check";
import { contentPaths } from "./paths";

export async function validateSnapshot(
  root: string,
  profile: "full" | "sample"
): Promise<void> {
  const failures = await validateContent(root, profile);
  const paths = contentPaths(root);
  const json = async (name: string): Promise<unknown> =>
    JSON.parse(await Bun.file(paths.manifest(name)).text());
  const localized = LocalizedArticlesMetaManifestSchema.parse(
    await json("articles-meta.zh-TW.json")
  );
  const translations = TranslationsManifestSchema.parse(
    await json("translations.json")
  );
  const search = SearchIndexSchema.parse(await json("search-index.json"));
  OpenQuestionsManifestSchema.parse(await json("open-questions.json"));
  WikiSourcesManifestSchema.parse(await json("wiki-sources.json"));
  const enSlugs = new Set(
    (await readdir(paths.articles)).map((f) => f.replace(MDX_SUFFIX, ""))
  );
  const zhFiles = (await readdir(paths.translated)).filter((f) =>
    f.endsWith(".mdx")
  );
  const zhSlugs = new Set(zhFiles.map((f) => f.replace(MDX_SUFFIX, "")));
  const assets = new Set(await readdir(paths.assets));
  const translated = await Promise.all(
    zhFiles.map(async (file) =>
      parseArticle(
        await Bun.file(join(paths.translated, file)).text(),
        file.replace(MDX_SUFFIX, "")
      )
    )
  );
  failures.push(
    ...checkHeroImages(translated, assets),
    ...checkFrontmatter(translated)
  );
  const rebuilt = await buildLocalizedArticlesMeta(
    localized.generatedOn,
    "zh-TW",
    paths.translated
  );
  if (JSON.stringify(rebuilt) !== JSON.stringify(localized)) {
    failures.push("Localized metadata differs from articles");
  }
  for (const slug of zhSlugs) {
    if (!(enSlugs.has(slug) && translations.articles[slug])) {
      failures.push(`Translation lacks source/provenance: ${slug}`);
    }
  }
  for (const slug of Object.keys(translations.articles)) {
    // Full releases preserve historical records for untranslated/retired projections.
    if (profile === "sample" && !zhSlugs.has(slug)) {
      failures.push(`Fixture translation record lacks article: ${slug}`);
    }
  }
  for (const entry of search.entries) {
    if (!enSlugs.has(entry.slug)) {
      failures.push(`Search entry lacks article: ${entry.slug}`);
    }
  }
  if (profile === "sample") {
    failures.push(...(await checkFixtureCoverage(root, enSlugs, zhSlugs)));
  }
  if (failures.length) {
    throw new Error(`Invalid ${profile} content:\n${failures.join("\n")}`);
  }
}

async function checkFixtureCoverage(
  root: string,
  enSlugs: Set<string>,
  zhSlugs: Set<string>
): Promise<string[]> {
  const failures: string[] = [];
  const paths = contentPaths(root);

  const coverage = z
    .strictObject({
      schemaVersion: z.literal(1),
      slugs: z.array(z.string()),
      domains: z.array(z.string()),
      locales: z.tuple([z.literal("en"), z.literal("zh-TW")]),
      articleBodyLinks: z.literal("production"),
    })
    .parse(
      await Bun.file(
        join(
          root,
          (await Bun.file(join(root, "coverage.json")).exists())
            ? "coverage.json"
            : ".content-coverage.json"
        )
      ).json()
    );
  const expected = [...coverage.slugs].sort();
  if (
    JSON.stringify(expected) !== JSON.stringify([...enSlugs].sort()) ||
    JSON.stringify(expected) !== JSON.stringify([...zhSlugs].sort())
  ) {
    failures.push("Fixture locale coverage does not match declaration");
  }
  const domains = [
    ...new Set(
      (
        await Bun.file(paths.manifest("articles-meta.json")).json()
      ).articles.map((a: { meta: { domain: string } }) => a.meta.domain)
    ),
  ].sort();
  if (
    JSON.stringify(domains) !== JSON.stringify([...coverage.domains].sort())
  ) {
    failures.push("Fixture domain coverage does not match declaration");
  }
  if (enSlugs.size === 0 || zhSlugs.size === 0) {
    failures.push("Fixtures must cover both languages");
  }
  return failures;
}
