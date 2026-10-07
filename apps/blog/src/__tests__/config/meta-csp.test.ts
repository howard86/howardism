import { describe, expect, it } from "bun:test";

import {
  BLOG_CSP_DIRECTIVES,
  serializeMetaCsp,
} from "@/config/security-headers";

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
