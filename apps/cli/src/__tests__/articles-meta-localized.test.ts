import { describe, expect, it } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parseLocalizedArticlesMeta } from "@howardism/article-contract/manifests/articles-meta";

const MDX_SUFFIX = /\.mdx$/;

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../../");
const ZH_ARTICLES_DIR = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles-zh-TW"
);
const ZH_MANIFEST_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/articles-meta.zh-TW.json"
);

const manifest = parseLocalizedArticlesMeta(
  JSON.parse(await readFile(ZH_MANIFEST_PATH, "utf8"))
);

describe("articles-meta.zh-TW.json", () => {
  it("covers exactly the committed zh-TW articles", async () => {
    const onDisk = (await readdir(ZH_ARTICLES_DIR))
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => name.replace(MDX_SUFFIX, ""))
      .sort();
    const inManifest = manifest.articles.map((entry) => entry.slug).sort();
    // A stale manifest is invisible at runtime: the /zh-TW/articles index just
    // silently omits (or invents) rows. Run `bun run build:articles-meta`.
    expect(inManifest).toEqual(onDisk);
  });

  it("is ordered date-descending then slug-ascending", () => {
    // The index route's own sort is stable, so this ordering is what breaks
    // ties between articles published on the same day.
    const keys = manifest.articles.map(
      (entry) => `${entry.meta.date}\u0000${entry.slug}`
    );
    const expected = [...manifest.articles]
      .map((entry) => `${entry.meta.date}\u0000${entry.slug}`)
      .sort((a, b) => {
        const [dateA, slugA] = a.split("\u0000") as [string, string];
        const [dateB, slugB] = b.split("\u0000") as [string, string];
        return dateA === dateB
          ? slugA.localeCompare(slugB)
          : dateB.localeCompare(dateA);
      });
    expect(keys).toEqual(expected);
  });

  it("carries a non-empty title for every entry", () => {
    const empty = manifest.articles.filter(
      (entry) => entry.meta.title.trim() === ""
    );
    expect(empty).toEqual([]);
  });

  it("declares the zh-TW locale", () => {
    expect(manifest.locale).toBe("zh-TW");
  });
});
