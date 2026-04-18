import { describe, expect, it } from "bun:test";

import {
  DEFAULT_CSP_DIRECTIVES,
  getSecurityHeaders,
  serializeCsp,
} from "./index.mjs";

const BARE_FORM_ERROR = /does not support bare/;

describe("getSecurityHeaders", () => {
  it("includes the six legacy hardening headers", () => {
    const headers = getSecurityHeaders({ geolocation: "()" });
    const keys = headers.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
        "Strict-Transport-Security",
        "Permissions-Policy",
      ])
    );
  });

  it("honours geolocation=(self)", () => {
    const headers = getSecurityHeaders({ geolocation: "(self)" });
    const permissions = headers.find((h) => h.key === "Permissions-Policy");
    expect(permissions?.value).toContain("geolocation=(self)");
  });

  it("emits Content-Security-Policy with the default directives", () => {
    const headers = getSecurityHeaders({ geolocation: "()" });
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp?.value).toContain("default-src 'self'");
    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(csp?.value).toContain("upgrade-insecure-requests");
  });

  it("does not emit the enforcing CSP header when cspReportOnly is true", () => {
    const headers = getSecurityHeaders({
      geolocation: "()",
      cspReportOnly: true,
    });
    expect(
      headers.find((h) => h.key === "Content-Security-Policy")
    ).toBeUndefined();
    const reportOnly = headers.find(
      (h) => h.key === "Content-Security-Policy-Report-Only"
    );
    expect(reportOnly).toBeDefined();
    expect(reportOnly?.value).toContain("default-src 'self'");
  });

  it("suppresses the CSP header entirely when contentSecurityPolicy is false", () => {
    const headers = getSecurityHeaders({
      geolocation: "()",
      contentSecurityPolicy: false,
    });
    expect(
      headers.some((h) => h.key.startsWith("Content-Security-Policy"))
    ).toBe(false);
  });

  it("replaces the default CSP wholesale when a directives object is passed", () => {
    const headers = getSecurityHeaders({
      geolocation: "()",
      contentSecurityPolicy: {
        "default-src": ["'none'"],
        "script-src": ["'self'"],
      },
    });
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp?.value).toBe("default-src 'none'; script-src 'self'");
    expect(csp?.value).not.toContain("unsafe-inline");
  });
});

describe("serializeCsp", () => {
  it("joins directives with '; ' and flattens sources with space", () => {
    expect(
      serializeCsp({
        "default-src": ["'self'"],
        "img-src": ["'self'", "https:", "data:"],
      })
    ).toBe("default-src 'self'; img-src 'self' https: data:");
  });

  it("emits bare directives as value-less tokens", () => {
    expect(serializeCsp({ "upgrade-insecure-requests": true })).toBe(
      "upgrade-insecure-requests"
    );
  });

  it("throws when a non-bare directive is passed `true`", () => {
    expect(() =>
      serializeCsp({
        "default-src": true,
      })
    ).toThrow(BARE_FORM_ERROR);
  });

  it("skips directives with empty source arrays", () => {
    expect(serializeCsp({ "default-src": ["'self'"], "script-src": [] })).toBe(
      "default-src 'self'"
    );
  });
});

describe("DEFAULT_CSP_DIRECTIVES", () => {
  it("is frozen to prevent accidental mutation", () => {
    expect(Object.isFrozen(DEFAULT_CSP_DIRECTIVES)).toBe(true);
  });

  it("restricts frame-ancestors to 'none' (pairs with X-Frame-Options: DENY)", () => {
    expect(DEFAULT_CSP_DIRECTIVES["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("restricts object-src to 'none'", () => {
    expect(DEFAULT_CSP_DIRECTIVES["object-src"]).toEqual(["'none'"]);
  });
});
