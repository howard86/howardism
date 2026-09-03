import { describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runWithConcurrency } from "../concurrency.ts";
import { parseWikiFile, type WikiSource } from "../import-wiki/parse.ts";

const FILE_COUNT = 24;
const PARSE_CONCURRENCY = 16;

describe("import-wiki parse concurrency (O4)", () => {
  it("runWithConcurrency(sources, 16, parseWikiFile) matches Promise.all(sources.map(parseWikiFile))", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-parse-concurrency-"));
    try {
      const sources: WikiSource[] = [];
      for (let i = 0; i < FILE_COUNT; i++) {
        const slug = `note-${i}`;
        const absolutePath = join(dir, `${slug}.md`);
        await writeFile(
          absolutePath,
          `---\ntitle: Note ${i}\n---\nBody for note ${i}.\n`
        );
        sources.push({ absolutePath, folder: "concepts", slug });
      }

      const [sequential, bounded] = await Promise.all([
        Promise.all(sources.map(parseWikiFile)),
        runWithConcurrency(sources, PARSE_CONCURRENCY, parseWikiFile),
      ]);

      expect(bounded.map((p) => p.source.slug)).toEqual(
        sequential.map((p) => p.source.slug)
      );
      expect(bounded.map((p) => p.frontmatter.title)).toEqual(
        sequential.map((p) => p.frontmatter.title)
      );
      expect(bounded.map((p) => p.body)).toEqual(sequential.map((p) => p.body));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
