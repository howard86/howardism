import { describe, expect, it } from "bun:test";
import type { ReactElement } from "react";

import { isRouteActive, languageHref } from "@/app/(blog)/(layout)/header";
import LocaleLayout from "@/app/(blog)/[locale]/layout";

describe("header route and language helpers", () => {
  it("matches article routes below the zh-TW prefix", () => {
    expect(isRouteActive("/zh-TW/articles", "/articles")).toBe(true);
    expect(isRouteActive("/zh-TW/articles/example", "/articles")).toBe(true);
    expect(isRouteActive("/zh-TW/questions", "/articles")).toBe(false);
  });

  it("uses an article translation when available", () => {
    expect(languageHref("/articles/example", "/zh-TW/articles/example")).toBe(
      "/zh-TW/articles/example"
    );
  });

  it("switches a zh-TW index to its English equivalent", () => {
    expect(languageHref("/zh-TW/articles")).toBe("/articles");
  });

  it("switches an English page to the zh-TW index", () => {
    expect(languageHref("/questions")).toBe("/zh-TW/articles");
  });

  it("sets the locale language without adding a layout box", async () => {
    const result = (await LocaleLayout({
      children: "content",
      params: Promise.resolve({ locale: "zh-TW" }),
    })) as ReactElement<{ className: string; lang: string }>;
    expect(result.props.lang).toBe("zh-TW");
    expect(result.props.className).toBe("contents");
  });
});
