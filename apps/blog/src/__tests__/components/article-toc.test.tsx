import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { ArticleToc } from "@/app/[locale]/(blog)/articles/[slug]/article-toc";
import type { ArticleHeading } from "@/app/[locale]/(blog)/articles/service";

afterEach(() => {
  cleanup();
});

const heading = (id: string, text: string): ArticleHeading => ({
  depth: 2,
  id,
  text,
});

describe("ArticleToc visibility threshold", () => {
  it("renders nothing for zero headings", () => {
    const { container } = render(<ArticleToc headings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for a single heading (no navigation value)", () => {
    const { container } = render(
      <ArticleToc headings={[heading("only", "Only Section")]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the nav once there are two or more headings", () => {
    const { container } = render(
      <ArticleToc
        headings={[heading("intro", "Intro"), heading("details", "Details")]}
      />
    );
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });
});

describe("ArticleToc aria-current", () => {
  it("marks the active heading with aria-current=location and leaves the rest unmarked", () => {
    const { container } = render(
      <ArticleToc
        headings={[heading("intro", "Intro"), heading("details", "Details")]}
      />
    );

    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(2);
    // With no headings in the DOM, useScrollSpy keeps its default active id
    // (the first section), so the first anchor is the active one.
    expect(anchors[0]?.getAttribute("aria-current")).toBe("location");
    expect(anchors[1]?.getAttribute("aria-current")).toBeNull();
  });
});
