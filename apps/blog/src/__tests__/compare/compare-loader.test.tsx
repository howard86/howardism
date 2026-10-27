import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createNextNavigationMock } from "@/test-support/next-navigation-mock";

let currentParams = new URLSearchParams();

mock.module("next/navigation", () =>
  createNextNavigationMock({ useSearchParams: () => currentParams })
);

const {
  articleUrlFrom,
  CompareLoader,
  extractArticleBody,
  extractArticleTitle,
} = await import("@/app/(blog)/compare/compare-loader");

const pageFor = (slug: string) =>
  `<html><head><title>Page ${slug}</title></head><body><header><h1>Title ${slug}</h1></header><article><div class="prose max-w-none" data-article-body><p>${slug} body</p></div></article></body></html>`;

const realFetch = globalThis.fetch;
const originalHref = window.location.href;
const setURL = (url: string) =>
  (
    window as unknown as { happyDOM: { setURL: (next: string) => void } }
  ).happyDOM.setURL(url);
const requested: string[] = [];

function stubFetch(status = 200) {
  globalThis.fetch = mock((input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    const slug = url.split("/").filter(Boolean).pop() ?? "";
    return Promise.resolve(new Response(pageFor(slug), { status }));
  }) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
  setURL(originalHref);
  requested.length = 0;
  currentParams = new URLSearchParams();
});

describe("extractArticleBody", () => {
  it("returns the prose wrapper, classes included", () => {
    const body = extractArticleBody(pageFor("alpha"));
    expect(body).toContain('class="prose max-w-none"');
    expect(body).toContain("<p>alpha body</p>");
    expect(body).not.toContain("<h1>");
  });

  it("returns null for a page without an article body", () => {
    expect(extractArticleBody("<html><body>404</body></html>")).toBeNull();
  });
});

describe("extractArticleTitle", () => {
  it("returns the page heading", () => {
    expect(extractArticleTitle(pageFor("alpha"))).toBe("Title alpha");
  });

  it("falls back to the page title", () => {
    expect(extractArticleTitle("<title>Page title</title>")).toBe("Page title");
  });
});

describe("articleUrlFrom", () => {
  it("keeps the slash-less form of a Vercel /compare URL", () => {
    expect(articleUrlFrom("/compare", "alpha")).toBe("/articles/alpha");
    expect(articleUrlFrom("/base/compare", "alpha")).toBe(
      "/base/articles/alpha"
    );
  });

  it("adds a trailing slash when /compare/ has one (static export)", () => {
    expect(articleUrlFrom("/compare/", "alpha")).toBe("/articles/alpha/");
    expect(articleUrlFrom("/base/compare/", "alpha")).toBe(
      "/base/articles/alpha/"
    );
  });
});

describe("CompareLoader", () => {
  it("shows the empty state when ids are not slug-shaped", () => {
    stubFetch();
    currentParams = new URLSearchParams("ids=bad%20slug,---");
    render(<CompareLoader />);

    expect(screen.getByText("Nothing to compare.")).not.toBeNull();
    expect(requested).toHaveLength(0);
  });

  it("resolves ids into panels and loads each body", async () => {
    stubFetch();
    setURL("http://localhost/base/compare/?ids=beta,ghost,alpha");
    currentParams = new URLSearchParams("ids=beta,ghost,alpha,delta");
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      const slug = url.split("/").filter(Boolean).pop() ?? "";
      return Promise.resolve(
        new Response(pageFor(slug), { status: slug === "ghost" ? 404 : 200 })
      );
    }) as unknown as typeof fetch;
    render(<CompareLoader />);

    await waitFor(() => {
      expect(screen.getByText("alpha body")).not.toBeNull();
      expect(screen.getByText("beta body")).not.toBeNull();
      expect(screen.getByRole("button", { name: "Title beta" })).not.toBeNull();
      // An unknown slug (404) is dropped, as the old server-side title map did.
      expect(screen.getByText("Comparing 2 articles")).not.toBeNull();
    });
    expect(screen.queryByText("This article could not be loaded.")).toBeNull();
    expect(requested.sort()).toEqual([
      "/base/articles/alpha/",
      "/base/articles/beta/",
      "/base/articles/ghost/",
    ]);
  });

  it("shows the empty state when every id is unknown", async () => {
    stubFetch(404);
    currentParams = new URLSearchParams("ids=ghost,phantom");
    render(<CompareLoader />);

    await waitFor(() => {
      expect(screen.getByText("Nothing to compare.")).not.toBeNull();
    });
  });

  it("marks a panel whose page fails to load", async () => {
    stubFetch(500);
    currentParams = new URLSearchParams("ids=gamma");
    render(<CompareLoader />);

    await waitFor(() => {
      expect(
        screen.getByText("This article could not be loaded.")
      ).not.toBeNull();
    });
  });
});
