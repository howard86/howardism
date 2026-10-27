import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
import {
  ArticleNavProvider,
  PublishArticleNav,
} from "@/components/article-nav-context";
import { SearchProvider } from "@/components/search/search-provider";
import { TweaksProvider } from "@/components/tweaks/tweaks-provider";
import { createNextNavigationMock } from "@/test-support/next-navigation-mock";

let pathname = "/";
mock.module("next/navigation", () =>
  createNextNavigationMock({ usePathname: () => pathname })
);

const { SiteBar } = await import("@/app/(blog)/(layout)/header");

const HEADINGS: ArticleHeading[] = [
  { depth: 2, id: "intro", text: "Introduction" },
  { depth: 2, id: "details", text: "Details" },
];
const THEME_SWITCH_NAME = /switch to (light|dark) mode/i;
const RSS_LINK_NAME = /rss/i;

function Providers({ children }: { children: ReactNode }) {
  return (
    <TweaksProvider>
      <ArticleNavProvider>
        <SearchProvider>{children}</SearchProvider>
      </ArticleNavProvider>
    </TweaksProvider>
  );
}

function renderSiteBar(
  route: string,
  article = false,
  translationHref?: string
) {
  pathname = route;
  return render(
    <Providers>
      {article ? (
        <PublishArticleNav
          headings={HEADINGS}
          readingTime={8}
          slug="example"
          translationHref={translationHref}
        />
      ) : null}
      <SiteBar />
    </Providers>
  );
}

function expectGlobalControls() {
  expect(
    screen.getAllByRole("button", { name: "Search articles" })
  ).toHaveLength(1);
  expect(
    screen.getAllByRole("button", { name: "Display settings" })
  ).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Menu" })).toHaveLength(1);
  expect(screen.queryByRole("button", { name: THEME_SWITCH_NAME })).toBeNull();
  expect(screen.queryByRole("button", { name: "Find in article" })).toBeNull();
  expect(screen.queryByRole("button", { name: "On this page" })).toBeNull();
}

afterEach(() => {
  cleanup();
});

describe("SiteBar", () => {
  it("renders exactly the shared tools on non-article pages", () => {
    renderSiteBar("/");
    expectGlobalControls();
  });

  it("renders exactly the shared tools on article pages", () => {
    renderSiteBar("/articles/example", true);
    expectGlobalControls();
  });

  it("marks Articles active in zh-TW and links back to English", () => {
    renderSiteBar("/zh-TW/articles");
    expect(
      screen
        .getByRole("link", { name: "Articles" })
        .getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Read in English" }).getAttribute("href")
    ).toBe("/articles");
  });

  it("uses the article translation href in the language switch", () => {
    renderSiteBar("/articles/example", true, "/zh-TW/articles/example");
    expect(
      screen.getByRole("link", { name: "Read in Chinese" }).getAttribute("href")
    ).toBe("/zh-TW/articles/example");
  });

  it("opens contents from the running head", async () => {
    renderSiteBar("/articles/example", true);
    expect(screen.getByRole("button", { name: "Contents" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Contents" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: "Introduction" })
    ).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: "Details" })).toBeTruthy();
  });

  it("keeps the empty running head non-interactive", () => {
    pathname = "/articles/empty";
    render(
      <Providers>
        <PublishArticleNav headings={[]} slug="empty" />
        <SiteBar />
      </Providers>
    );
    expect(screen.queryByRole("button", { name: "Contents" })).toBeNull();
  });

  it("opens the mobile menu with routes and language choices only", async () => {
    renderSiteBar("/");
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const dialog = await screen.findByRole("dialog");
    const menu = within(dialog);
    expect(menu.getByRole("button", { name: "Close" })).toBeTruthy();
    const navigation = within(
      menu.getByRole("navigation", { name: "Mobile primary" })
    );
    for (const route of ["Home", "Articles", "Questions", "Shelf"]) {
      expect(navigation.getByRole("link", { name: route })).toBeTruthy();
    }
    expect(menu.getByText("English")).toBeTruthy();
    expect(menu.getByRole("link", { name: "繁體中文" })).toBeTruthy();
    expect(menu.queryByRole("link", { name: RSS_LINK_NAME })).toBeNull();
    expect(menu.queryByText("Quick Navigation")).toBeNull();
  });

  it("includes the skip-to-content link", () => {
    renderSiteBar("/");
    expect(
      screen.getByRole("link", { name: "Skip to content" }).getAttribute("href")
    ).toBe("#main-content");
  });
});
