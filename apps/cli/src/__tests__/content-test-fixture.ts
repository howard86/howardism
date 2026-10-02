import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { WIKI_DOMAINS, WIKI_TAGS } from "@howardism/article-contract";
import {
  buildArticlesMeta,
  buildLocalizedArticlesMeta,
} from "../articles-meta";

/** Small generated corpus for offline release tests after published content leaves Git. */
export async function createTestContent(root: string): Promise<void> {
  const articles = resolve(root, "content/articles");
  const translated = resolve(root, "content/articles-zh-TW");
  const assets = resolve(root, "content/assets");
  const data = resolve(root, "data");
  for (const path of [articles, translated, assets, data]) {
    await mkdir(path, { recursive: true });
  }
  const slugs: string[] = [];
  for (const [index, domain] of WIKI_DOMAINS.entries()) {
    const slug = `test-${domain}`;
    slugs.push(slug);
    const frontmatter = (title: string): string =>
      `---\ndate: "2026-01-01"\ntitle: ${title}\ndescription: Test article for ${domain}\ntag: ${WIKI_TAGS[0]}\ndomain: ${domain}\nreadingTime: 1\nimageAlt: Test illustration\n---\nexport { default as heroImage } from "../assets/${slug}.webp";\n\nTest body.\n`;
    await Bun.write(
      resolve(articles, `${slug}.mdx`),
      frontmatter(`Test ${domain}`)
    );
    await Bun.write(
      resolve(translated, `${slug}.mdx`),
      frontmatter(`Translated ${domain}`)
    );
    await Bun.write(
      resolve(assets, `${slug}.webp`),
      new Uint8Array([82, 73, 70, 70, index + 1])
    );
  }
  const write = async (name: string, value: unknown): Promise<void> => {
    await Bun.write(resolve(data, name), `${JSON.stringify(value)}\n`);
  };
  const enMeta = await buildArticlesMeta("2026-01-01", articles);
  const zhMeta = await buildLocalizedArticlesMeta(
    "2026-01-01",
    "zh-TW",
    translated
  );
  await write("articles-meta.json", enMeta);
  await write("articles-meta.zh-TW.json", zhMeta);
  await write("article-graph.json", {
    generatedOn: "2026-01-01",
    backlinks: {},
    related: {},
  });
  await write("open-questions.json", {
    generatedOn: "2026-01-01",
    byConcept: [],
  });
  await write("wiki-sources.json", { generatedOn: "2026-01-01", sources: [] });
  await write("search-index.json", { generatedOn: "2026-01-01", entries: [] });
  await write("translations.json", {
    generatedOn: "2026-01-01",
    locale: "zh-TW",
    articles: Object.fromEntries(
      enMeta.articles.map((article) => [
        article.slug,
        {
          costUsd: null,
          credits: null,
          durationMs: 0,
          engine: "test",
          model: null,
          sourceHash: article.sourceHash,
          sourceTitle: article.meta.title,
          translatedAt: "2026-01-01",
        },
      ])
    ),
  });
  await Bun.write(
    resolve(root, "coverage.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      slugs: slugs.sort(),
      domains: [...WIKI_DOMAINS].sort(),
      locales: ["en", "zh-TW"],
      articleBodyLinks: "production",
    })}\n`
  );
}
