import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { redirects } from "../../../blog/src/config/redirects";
import {
  expandRedirects,
  renderRedirectStub,
  writeStubs,
} from "../pages-export/redirects";

describe("expandRedirects", () => {
  const expanded = expandRedirects(redirects);

  it("expands moc-:domain per domain", () => {
    expect(expanded).toContainEqual({
      source: "/articles/moc-agent-systems",
      destination: "/articles/domain/agent-systems",
    });
  });

  it("expands topic slugs and leaves no placeholders", () => {
    expect(expanded.map((r) => r.source)).toContain("/articles/topic/harness");
    expect(expanded.some((r) => r.source.includes(":"))).toBe(false);
  });

  it("skips parameterised rules with no known values", () => {
    expect(
      expandRedirects(
        [{ source: "/x/:id", destination: "/y", permanent: true }],
        {}
      )
    ).toEqual([]);
  });
});

describe("renderRedirectStub", () => {
  it("refreshes to a trailing-slash destination and points canonical at www", () => {
    const html = renderRedirectStub("/articles");
    expect(html).toContain('content="0; url=/articles/"');
    expect(html).toContain('href="https://www.howardism.dev/articles/"');
    expect(html).toContain('name="robots" content="noindex"');
  });
});

describe("writeStubs", () => {
  it("overwrites an existing page at a redirect source", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pages-redirects-"));
    try {
      await mkdir(join(dir, "old"), { recursive: true });
      await writeFile(join(dir, "old", "index.html"), "<html>real page</html>");
      const result = await writeStubs(dir, [
        { source: "/old", destination: "/new", permanent: true },
        { source: "/fresh", destination: "/new", permanent: true },
      ]);
      expect(result).toEqual({ written: 2, replaced: 1 });
      expect(await readFile(join(dir, "old", "index.html"), "utf8")).toContain(
        'url=/new/"'
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
