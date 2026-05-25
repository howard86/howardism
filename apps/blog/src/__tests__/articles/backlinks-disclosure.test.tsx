import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { BacklinksDisclosureView } from "@/app/[locale]/(blog)/articles/[slug]/backlinks-disclosure";

import type {
  ArticleLink,
  ArticleMeta,
} from "@/app/[locale]/(blog)/articles/service";

afterEach(() => {
  cleanup();
});

function makeLink(
  slug: string,
  overrides: Partial<ArticleMeta> = {}
): ArticleLink {
  const meta: ArticleMeta = {
    date: "2026-05-01",
    description: `Description for ${slug}.`,
    imageAlt: "alt",
    readingTime: 2,
    tag: "Entity",
    title: `Title for ${slug}`,
    ...overrides,
  };
  return { slug, meta };
}

describe("BacklinksDisclosureView — empty state", () => {
  it("renders nothing when both backlinks and related are empty", () => {
    const { container } = render(
      <BacklinksDisclosureView backlinks={[]} related={[]} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("BacklinksDisclosureView — cited-by label", () => {
  it("renders the cited-by count for a single backlink", () => {
    render(
      <BacklinksDisclosureView
        backlinks={[makeLink("anthropic")]}
        related={[]}
      />
    );
    expect(screen.getByText("Cited by 1")).toBeDefined();
  });

  it("renders the cited-by count for multiple backlinks", () => {
    render(
      <BacklinksDisclosureView
        backlinks={[
          makeLink("anthropic"),
          makeLink("boris-cherny"),
          makeLink("cat-wu"),
        ]}
        related={[]}
      />
    );
    expect(screen.getByText("Cited by 3")).toBeDefined();
  });
});

describe("BacklinksDisclosureView — list rendering", () => {
  it("renders only the backlinks disclosure when related is empty", () => {
    const { container } = render(
      <BacklinksDisclosureView
        backlinks={[makeLink("anthropic")]}
        related={[]}
      />
    );
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(screen.queryByText("Related articles")).toBeNull();
  });

  it("renders only the related disclosure when backlinks is empty", () => {
    const { container } = render(
      <BacklinksDisclosureView backlinks={[]} related={[makeLink("cowork")]} />
    );
    expect(container.querySelectorAll("details")).toHaveLength(1);
    expect(screen.getByText("Related articles")).toBeDefined();
  });

  it("renders both disclosures when both lists are populated", () => {
    const { container } = render(
      <BacklinksDisclosureView
        backlinks={[makeLink("anthropic"), makeLink("boris-cherny")]}
        related={[makeLink("cowork")]}
      />
    );
    expect(container.querySelectorAll("details")).toHaveLength(2);
    expect(screen.getByText("Cited by 2")).toBeDefined();
    expect(screen.getByText("Related articles")).toBeDefined();
  });

  it("emits an InternalLink with the correct href for each row", () => {
    const { container } = render(
      <BacklinksDisclosureView
        backlinks={[makeLink("anthropic"), makeLink("boris-cherny")]}
        related={[]}
      />
    );
    const links = container.querySelectorAll("a[href^='/articles/']");
    const hrefs = Array.from(links).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/articles/anthropic", "/articles/boris-cherny"]);
  });

  it("renders disclosures as default-closed (no [open] attribute)", () => {
    const { container } = render(
      <BacklinksDisclosureView
        backlinks={[makeLink("anthropic")]}
        related={[makeLink("cowork")]}
      />
    );
    for (const details of container.querySelectorAll("details")) {
      expect(details.hasAttribute("open")).toBe(false);
    }
  });

  it("truncates descriptions longer than ~120 chars with an ellipsis", () => {
    const longDescription = `${"x".repeat(200)}.`;
    render(
      <BacklinksDisclosureView
        backlinks={[makeLink("long-one", { description: longDescription })]}
        related={[]}
      />
    );
    const paragraphs = document.querySelectorAll("li > p");
    expect(paragraphs.length).toBe(1);
    const text = paragraphs[0].textContent ?? "";
    expect(text.endsWith("…")).toBe(true);
    expect(text.length).toBeLessThan(longDescription.length);
  });
});
