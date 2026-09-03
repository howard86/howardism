import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type ArticleMeta, emitArticle } from "../import-wiki/emit.ts";

const META: ArticleMeta = {
  date: "2026-01-01",
  title: "Test Article",
  description: "A test.",
  tag: "Concept",
  domain: "syntheses",
  readingTime: 1,
};

describe("emitArticle directory handling (O5)", () => {
  it("writes successfully when the caller has already created articlesDir", async () => {
    const dir = await mkdtemp(join(tmpdir(), "emit-precreated-"));
    try {
      const filePath = await emitArticle({
        articlesDir: dir,
        slug: "test-article",
        imageFile: "test-article.webp",
        imageAlt: "alt text",
        meta: META,
        body: "Body text.",
      });
      const written = await readFile(filePath, "utf8");
      expect(written).toContain("Test Article");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // Proves emitArticle no longer creates its own directory: the caller
  // (index.ts's main()) is now solely responsible for that, done once up
  // front rather than once per emitted article.
  it("no longer self-creates a missing articlesDir", async () => {
    const dir = await mkdtemp(join(tmpdir(), "emit-missing-"));
    const missingSubdir = join(dir, "does-not-exist");
    try {
      await expect(
        emitArticle({
          articlesDir: missingSubdir,
          slug: "test-article",
          imageFile: "test-article.webp",
          imageAlt: "alt text",
          meta: META,
          body: "Body text.",
        })
      ).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
