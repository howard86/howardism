import { describe, expect, it } from "bun:test";

import { redirects } from "@/config/redirects";
import {
  BLOG_CSP_DIRECTIVES,
  serializeMetaCsp,
} from "@/config/security-headers";

import {
  expandRedirects,
  renderRedirectStub,
} from "../../../scripts/pages-redirects";

describe("serializeMetaCsp", () => {
  it("drops directives browsers ignore in a meta tag", () => {
    const csp = serializeMetaCsp({
      ...BLOG_CSP_DIRECTIVES,
      "report-uri": ["/r"],
    });
    expect(csp).not.toContain("frame-ancestors");
    expect(csp).not.toContain("report-uri");
    expect(csp).toContain("default-src 'self'");
  });
});

describe("expandRedirects", () => {
  const expanded = expandRedirects(redirects);

  it("expands moc-:domain per domain", () => {
    expect(expanded).toContainEqual({
      source: "/articles/moc-agent-systems",
      destination: "/articles/domain/agent-systems",
    });
  });

  it("expands topic slugs and leaves no placeholders", () => {
    expect(expanded.map((r) => r.source)).toContain("/articles/topic/harness");
    expect(expanded.some((r) => r.source.includes(":"))).toBe(false);
  });

  it("skips parameterised rules with no known values", () => {
    expect(
      expandRedirects(
        [{ source: "/x/:id", destination: "/y", permanent: true }],
        {}
      )
    ).toEqual([]);
  });
});

describe("renderRedirectStub", () => {
  it("refreshes to a trailing-slash destination and points canonical at www", () => {
    const html = renderRedirectStub("/articles");
    expect(html).toContain('content="0; url=/articles/"');
    expect(html).toContain('href="https://www.howardism.dev/articles/"');
    expect(html).toContain('name="robots" content="noindex"');
  });
});
