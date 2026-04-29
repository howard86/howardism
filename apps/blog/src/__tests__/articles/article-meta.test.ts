import { describe, expect, it } from "bun:test";

import type { ArticleMeta } from "@/app/(blog)/articles/service";

describe("ArticleMeta", () => {
  it("accepts a fully-specified meta object", () => {
    const meta: ArticleMeta = {
      date: "2024-01-01",
      description: "A description",
      image: { src: {} as never, alt: "alt text" },
      readingTime: 3,
      tag: "Engineering",
      title: "A title",
    };
    expect(meta.tag).toBe("Engineering");
    expect(meta.readingTime).toBe(3);
  });

  it("accepts meta with optional dropCap", () => {
    const meta: ArticleMeta = {
      date: "2024-01-01",
      description: "A description",
      dropCap: true,
      image: { src: {} as never, alt: "alt text" },
      readingTime: 2,
      tag: "Personal",
      title: "A title",
    };
    expect(meta.dropCap).toBe(true);
  });

  it("requires tag — missing tag is a type error", () => {
    // @ts-expect-error tag is required
    const _missing: ArticleMeta = {
      date: "2024-01-01",
      description: "A description",
      image: { src: {} as never, alt: "alt text" },
      readingTime: 3,
      title: "A title",
    };
    expect(true).toBe(true);
  });

  it("requires readingTime — missing readingTime is a type error", () => {
    // @ts-expect-error readingTime is required
    const _missing: ArticleMeta = {
      date: "2024-01-01",
      description: "A description",
      image: { src: {} as never, alt: "alt text" },
      tag: "Engineering",
      title: "A title",
    };
    expect(true).toBe(true);
  });
});
