import { describe, expect, it } from "bun:test";
import { mkdtemp, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { assertCatalogFresh } from "../import-wiki/catalog.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

const CATALOG_BUILT = new Date("2026-08-27T05:03:20.586Z");
const STALE_ERROR = /is stale/;
const NAMED_PAGE_ERROR = /attention-is-all-you-need/;

function page(
  slug: string,
  mtime: Date,
  overrides: Partial<ParsedWikiFile> = {}
): ParsedWikiFile {
  return {
    source: { slug, folder: "concepts", absolutePath: `/tmp/${slug}.md` },
    frontmatter: {},
    body: "",
    mtime,
    isGenerated: false,
    ...overrides,
  };
}

async function catalogAt(mtime: Date): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "catalog-fresh-"));
  const path = join(dir, "catalog.tsv");
  await writeFile(path, "path\ttype\tdomain\ttitle\tsummary\tupdated\tbytes\n");
  await utimes(path, mtime, mtime);
  return path;
}

describe("assertCatalogFresh", () => {
  it("passes when every cataloged page predates the catalog", async () => {
    const path = await catalogAt(CATALOG_BUILT);
    await assertCatalogFresh(path, [
      page("attention-is-all-you-need", new Date("2026-08-26T00:00:00Z")),
    ]);
  });

  it("throws naming the page that outran the catalog", async () => {
    const path = await catalogAt(CATALOG_BUILT);
    await expect(
      assertCatalogFresh(path, [
        page("attention-is-all-you-need", new Date("2026-08-28T00:00:00Z")),
      ])
    ).rejects.toThrow(NAMED_PAGE_ERROR);
  });

  it("ignores moc-* pages, which build.py rewrites after the catalog", async () => {
    const path = await catalogAt(CATALOG_BUILT);
    await assertCatalogFresh(path, [
      page("moc-evals-and-benchmarks", new Date("2026-08-27T05:03:20.587Z")),
    ]);
  });

  it("ignores `generated: true` pages, which carry no catalog row", async () => {
    const path = await catalogAt(CATALOG_BUILT);
    await assertCatalogFresh(path, [
      page("open-questions", new Date("2026-08-28T00:00:00Z"), {
        source: {
          slug: "open-questions",
          folder: "derived",
          absolutePath: "/tmp/open-questions.md",
        },
        isGenerated: true,
      }),
    ]);
  });

  it("still catches a real edit hiding behind exempt pages", async () => {
    const path = await catalogAt(CATALOG_BUILT);
    await expect(
      assertCatalogFresh(path, [
        page("moc-agent-systems", new Date("2026-08-29T00:00:00Z")),
        page("scaling-laws", new Date("2026-08-28T00:00:00Z")),
      ])
    ).rejects.toThrow(STALE_ERROR);
  });
});
