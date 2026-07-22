import { describe, expect, it } from "bun:test";

import {
  extractTranslatableSurface,
  surfaceHash,
} from "@howardism/article-contract/surface";
import {
  resyncVerbatimFields,
  sourceTitle,
  verbatimDiffers,
} from "../translate/surface.ts";

interface MdxParts {
  body?: string;
  date?: string;
  description?: string;
  domain?: string;
  imageAlt?: string;
  readingTime?: number;
  sources?: { title: string; url: string }[];
  tag?: string;
  title?: string;
}

const mdx = (p: MdxParts = {}): string => {
  const lines = [
    "---",
    `date: ${p.date ?? "2026-05-06"}`,
    `title: ${p.title ?? "Boris Cherny"}`,
    `description: ${p.description ?? "An IC voice on Claude Code"}`,
    `tag: ${p.tag ?? "Entity"}`,
    `domain: ${p.domain ?? "entities"}`,
    `readingTime: ${p.readingTime ?? 4}`,
    `imageAlt: ${p.imageAlt ?? "Illustration for Boris Cherny"}`,
  ];
  if (p.sources) {
    lines.push("sources:");
    for (const s of p.sources) {
      lines.push(`  - title: "${s.title}"`, `    url: ${s.url}`);
    }
  }
  lines.push(
    "---",
    'export { default as heroImage } from "../assets/boris-cherny.png";',
    "",
    p.body ?? "Body paragraph about the subject."
  );
  return lines.join("\n");
};

describe("surfaceHash", () => {
  it("is deterministic for identical input", () => {
    expect(surfaceHash(mdx())).toBe(surfaceHash(mdx()));
  });

  it("ignores changes to verbatim-only fields (date, readingTime, tag, domain)", () => {
    const base = surfaceHash(mdx());
    expect(surfaceHash(mdx({ date: "2099-01-01" }))).toBe(base);
    expect(surfaceHash(mdx({ readingTime: 99 }))).toBe(base);
    expect(surfaceHash(mdx({ tag: "Concept" }))).toBe(base);
    expect(surfaceHash(mdx({ domain: "harness" }))).toBe(base);
  });

  it("changes when translatable fields change", () => {
    const base = surfaceHash(mdx());
    expect(surfaceHash(mdx({ title: "Someone Else" }))).not.toBe(base);
    expect(surfaceHash(mdx({ description: "different" }))).not.toBe(base);
    expect(surfaceHash(mdx({ imageAlt: "different" }))).not.toBe(base);
    expect(surfaceHash(mdx({ body: "Totally rewritten body." }))).not.toBe(
      base
    );
  });

  it("changes when a reference link is added (the 'wiki evolves' case)", () => {
    const before = surfaceHash(mdx());
    const after = surfaceHash(
      mdx({ sources: [{ title: "New Talk", url: "https://example.com/x" }] })
    );
    expect(after).not.toBe(before);
  });

  it("is insensitive to CRLF vs LF line endings", () => {
    const lf = mdx();
    const crlf = lf.replace(/\n/g, "\r\n");
    expect(surfaceHash(crlf)).toBe(surfaceHash(lf));
  });
});

describe("extractTranslatableSurface", () => {
  it("pulls title, description, imageAlt, tags, sources, body", () => {
    const surface = extractTranslatableSurface(
      mdx({ sources: [{ title: "T", url: "https://e.com" }] })
    );
    expect(surface.title).toBe("Boris Cherny");
    expect(surface.sources).toEqual([{ title: "T", url: "https://e.com" }]);
    expect(surface.body).toContain("Body paragraph");
  });
});

describe("verbatimDiffers", () => {
  it("is false when verbatim fields match", () => {
    expect(verbatimDiffers(mdx(), mdx())).toBe(false);
  });

  it("is true when a verbatim scalar drifts", () => {
    expect(
      verbatimDiffers(mdx({ date: "2026-05-06" }), mdx({ date: "2026-06-01" }))
    ).toBe(true);
    expect(
      verbatimDiffers(mdx({ readingTime: 4 }), mdx({ readingTime: 7 }))
    ).toBe(true);
  });

  it("does not confuse `tag` with `tags`", () => {
    // `tag:` line present in both; differing only by domain should be detected.
    expect(
      verbatimDiffers(mdx({ domain: "entities" }), mdx({ domain: "harness" }))
    ).toBe(true);
  });
});

const DOMAIN_LINE_RE = /^domain:.*\n/m;

describe("resyncVerbatimFields", () => {
  it("copies source verbatim fields into output, leaving translated fields intact", () => {
    const source = mdx({
      date: "2026-09-09",
      readingTime: 12,
      title: "Boris Cherny",
    });
    const output = mdx({
      date: "2026-05-06",
      readingTime: 4,
      title: "波里斯·切爾尼",
      description: "翻譯後的描述",
    });
    const resynced = resyncVerbatimFields(output, source);
    expect(resynced).toContain("date: 2026-09-09");
    expect(resynced).toContain("readingTime: 12");
    // Translated fields untouched.
    expect(resynced).toContain("title: 波里斯·切爾尼");
    expect(resynced).toContain("description: 翻譯後的描述");
    // After resync, verbatim fields agree.
    expect(verbatimDiffers(source, resynced)).toBe(false);
  });

  it("is a no-op when verbatim fields already match", () => {
    const text = mdx();
    expect(resyncVerbatimFields(text, text)).toBe(text);
  });

  it("appends a verbatim key the translation is missing entirely", () => {
    // Translations predating `domain` carry no such line; skipping them left
    // them classified verbatim-drift on every run while the resync no-oped.
    const source = mdx({ domain: "agent-security" });
    const output = mdx().replace(DOMAIN_LINE_RE, "");
    expect(output).not.toContain("domain:");

    const resynced = resyncVerbatimFields(output, source);
    expect(resynced).toContain("domain: agent-security");
    expect(verbatimDiffers(source, resynced)).toBe(false);
  });
});

describe("sourceTitle", () => {
  it("returns the source frontmatter title", () => {
    expect(sourceTitle(mdx({ title: "Cat Wu" }))).toBe("Cat Wu");
  });
});
