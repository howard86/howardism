import { describe, expect, it } from "bun:test";
import { getSecurityHeaders } from "./securityHeaders";

describe("getSecurityHeaders", () => {
  const headers = getSecurityHeaders({ geolocation: "()" });

  it("includes X-Content-Type-Options: nosniff", () => {
    const header = headers.find((h) => h.key === "X-Content-Type-Options");
    expect(header?.value).toBe("nosniff");
  });

  it("includes X-Frame-Options: DENY", () => {
    const header = headers.find((h) => h.key === "X-Frame-Options");
    expect(header?.value).toBe("DENY");
  });

  it("includes X-XSS-Protection: 0", () => {
    const header = headers.find((h) => h.key === "X-XSS-Protection");
    expect(header?.value).toBe("0");
  });

  it("includes Referrer-Policy: strict-origin-when-cross-origin", () => {
    const header = headers.find((h) => h.key === "Referrer-Policy");
    expect(header?.value).toBe("strict-origin-when-cross-origin");
  });

  it("includes Strict-Transport-Security without preload", () => {
    const header = headers.find((h) => h.key === "Strict-Transport-Security");
    expect(header?.value).toBe("max-age=63072000; includeSubDomains");
    expect(header?.value).not.toContain("preload");
  });

  it("includes Permissions-Policy with geolocation=()", () => {
    const header = headers.find((h) => h.key === "Permissions-Policy");
    expect(header?.value).toContain("camera=()");
    expect(header?.value).toContain("microphone=()");
    expect(header?.value).toContain("geolocation=()");
  });

  it("allows geolocation=(self) when specified", () => {
    const blogHeaders = getSecurityHeaders({ geolocation: "(self)" });
    const header = blogHeaders.find((h) => h.key === "Permissions-Policy");
    expect(header?.value).toContain("geolocation=(self)");
  });

  it("returns exactly 6 headers", () => {
    expect(headers).toHaveLength(6);
  });
});
