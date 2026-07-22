import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  computeOrphanedSlugs,
  deriveVaultSlugSet,
  pruneOrphanedArticles,
} from "../import-wiki/prune.ts";

describe("deriveVaultSlugSet", () => {
  it("includes archived notes — they still exist in the vault, only emission skips them", () => {
    const set = deriveVaultSlugSet([
      { source: { slug: "kept-note", folder: "concepts", absolutePath: "" } },
      {
        source: { slug: "archived-note", folder: "concepts", absolutePath: "" },
      },
    ]);

    expect(set.has("kept-note")).toBe(true);
    expect(set.has("archived-note")).toBe(true);
  });
});

describe("computeOrphanedSlugs", () => {
  const vaultSlugs = deriveVaultSlugSet([
    { source: { slug: "kept-note", folder: "concepts", absolutePath: "" } },
    {
      source: { slug: "archived-note", folder: "concepts", absolutePath: "" },
    },
  ]);

  it("flags an on-disk slug with no matching vault note as orphaned", () => {
    const orphans = computeOrphanedSlugs({
      onDiskSlugs: ["kept-note", "archived-note", "deleted-note"],
      vaultSlugs,
      onlySlug: null,
    });

    expect(orphans).toEqual(["deleted-note"]);
  });

  it("does not orphan an archived note — its slug is still in the vault set", () => {
    const orphans = computeOrphanedSlugs({
      onDiskSlugs: ["archived-note"],
      vaultSlugs,
      onlySlug: null,
    });

    expect(orphans).toEqual([]);
  });

  it("prunes nothing in --only mode, even with a genuine orphan on disk", () => {
    const orphans = computeOrphanedSlugs({
      onDiskSlugs: ["kept-note", "deleted-note"],
      vaultSlugs,
      onlySlug: "kept-note",
    });

    expect(orphans).toEqual([]);
  });
});

describe("pruneOrphanedArticles", () => {
  async function makeFixture() {
    const root = await mkdtemp(join(tmpdir(), "prune-"));
    const articlesDir = join(root, "articles");
    const assetsDir = join(root, "assets");
    const zhArticlesDir = join(root, "articles-zh-TW");
    await Promise.all([
      mkdir(articlesDir, { recursive: true }),
      mkdir(assetsDir, { recursive: true }),
      mkdir(zhArticlesDir, { recursive: true }),
    ]);

    for (const slug of ["kept-note", "deleted-note"]) {
      await writeFile(join(articlesDir, `${slug}.mdx`), "content");
      await writeFile(join(assetsDir, `${slug}.png`), "png");
      await writeFile(join(zhArticlesDir, `${slug}.mdx`), "content-zh");
    }

    return { articlesDir, assetsDir, zhArticlesDir };
  }

  it("deletes the orphan's MDX, hero PNG, and zh-TW translation, keeps the rest", async () => {
    const { articlesDir, assetsDir, zhArticlesDir } = await makeFixture();
    const vaultSlugs = new Set(["kept-note"]);

    const orphans = await pruneOrphanedArticles({
      articlesDir,
      assetsDir,
      zhArticlesDir,
      vaultSlugs,
      onlySlug: null,
      dryRun: false,
    });

    expect(orphans).toEqual(["deleted-note"]);
    expect(await Bun.file(join(articlesDir, "deleted-note.mdx")).exists()).toBe(
      false
    );
    expect(await Bun.file(join(assetsDir, "deleted-note.png")).exists()).toBe(
      false
    );
    expect(
      await Bun.file(join(zhArticlesDir, "deleted-note.mdx")).exists()
    ).toBe(false);
    expect(await Bun.file(join(articlesDir, "kept-note.mdx")).exists()).toBe(
      true
    );
  });

  it("DRY_RUN leaves every file on disk untouched", async () => {
    const { articlesDir, assetsDir, zhArticlesDir } = await makeFixture();
    const vaultSlugs = new Set(["kept-note"]);

    const orphans = await pruneOrphanedArticles({
      articlesDir,
      assetsDir,
      zhArticlesDir,
      vaultSlugs,
      onlySlug: null,
      dryRun: true,
    });

    expect(orphans).toEqual(["deleted-note"]);
    expect(await Bun.file(join(articlesDir, "deleted-note.mdx")).exists()).toBe(
      true
    );
  });
});
