import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ArticleLinkRow } from "@/app/(blog)/articles/[slug]/article-link-row";
import type { ArticleLink } from "@/app/(blog)/articles/service";

afterEach(() => {
  cleanup();
});

const TITLE = /Alpha Article/i;

function renderRow(link: Partial<ArticleLink> = {}) {
  const base: ArticleLink = {
    slug: "alpha",
    meta: {
      date: "2026-05-06",
      description: "A description",
      imageAlt: "alt",
      readingTime: 7,
      tag: "Concept",
      title: "Alpha Article",
    },
  };
  return render(<ArticleLinkRow link={{ ...base, ...link }} />);
}

describe("ArticleLinkRow", () => {
  it("links to the article", () => {
    renderRow();
    const link = screen.getByRole("link", { name: TITLE });
    expect(link.getAttribute("href")).toBe("/articles/alpha");
  });

  it("truncates the hover preview's description with a trailing ellipsis", async () => {
    const longDescription = `${"a".repeat(200)}.`;
    renderRow({
      meta: {
        date: "2026-05-06",
        description: longDescription,
        imageAlt: "alt",
        readingTime: 7,
        tag: "Concept",
        title: "Alpha Article",
      },
    });

    fireEvent.focus(screen.getByRole("link", { name: TITLE }));
    const dialog = await screen.findByRole("dialog");

    const paragraph = dialog.querySelector("p");
    expect(paragraph?.textContent?.endsWith("…")).toBe(true);
    expect(paragraph?.textContent?.length).toBeLessThan(longDescription.length);
  });
});
