import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { ArticleToc } from "@/app/(blog)/articles/[slug]/article-toc";
import type { ArticleHeading } from "@/app/(blog)/articles/service";

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
