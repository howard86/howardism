import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { Footer } from "@/app/(blog)/(layout)/footer";

afterEach(() => {
  cleanup();
});

describe("footer assets", () => {
  it("renders the three labelled asset groups and their links", () => {
    render(<Footer />);

    for (const heading of ["Subscribe", "For machines", "Elsewhere"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeDefined();
      expect(screen.getByRole("region", { name: heading })).toBeDefined();
    }

    const expectedLinks = [
      ["RSS", "/rss/feed.xml"],
      ["JSON feed", "/rss/feed.json"],
      ["llms.txt", "/llms.txt"],
      ["sitemap.xml", "/sitemap.xml"],
      ["GitHub", "https://github.com/Howard86/"],
      ["LinkedIn", "https://www.linkedin.com/in/howard-tai-4b52b086/"],
      ["X", "https://twitter.com/howard86_"],
      ["Email", "mailto:howard@howardism.dev"],
    ];

    for (const [label, href] of expectedLinks) {
      expect(
        screen.getByRole("link", { name: label }).getAttribute("href")
      ).toBe(href);
    }
  });

  it("keeps navigation out and renders file routes as plain anchors", () => {
    const { container } = render(<Footer />);

    for (const href of ["/", "/articles", "/questions", "/shelf"]) {
      expect(container.querySelector(`a[href="${href}"]`)).toBeNull();
    }

    expect(container.querySelectorAll('a[href="/rss/feed.xml"]').length).toBe(
      1
    );
    for (const href of [
      "/rss/feed.xml",
      "/rss/feed.json",
      "/llms.txt",
      "/sitemap.xml",
    ]) {
      const link = container.querySelector(`a[href="${href}"]`);
      expect(link?.tagName).toBe("A");
      expect(link?.hasAttribute("target")).toBe(false);
    }
  });
});
